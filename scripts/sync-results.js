#!/usr/bin/env node
/**
 * sync-results.js — Sincroniza resultados de football-data.org → Firestore
 * y calcula puntos de las predicciones. Pensado para GitHub Actions.
 *
 * Variables de entorno necesarias:
 *   FOOTBALL_API_KEY    → Token de football-data.org
 *   FIREBASE_PROJECT_ID → ID del proyecto Firebase
 *   FIREBASE_API_KEY    → API Key pública de Firebase
 *   ADMIN_EMAIL         → Email del usuario admin
 *   ADMIN_PASSWORD      → Contraseña del admin
 *
 * Ejecutar: node scripts/sync-results.js
 * (local: lee .env.local si existe)
 */
'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Cargar .env.local si existe (uso local)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim();
      if (k && v && !process.env[k]) process.env[k] = v;
    }
  });
}

const FOOTBALL_KEY = process.env.FOOTBALL_API_KEY;
const FB_PROJECT   = process.env.FIREBASE_PROJECT_ID;
const FB_API_KEY   = process.env.FIREBASE_API_KEY;
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL;
const ADMIN_PASS   = process.env.ADMIN_PASSWORD;
const COMPETITION  = 'WC';

if (!FOOTBALL_KEY || !FB_PROJECT || !FB_API_KEY || !ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('❌ Faltan variables: FOOTBALL_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WCP-Sync/1.0', ...headers } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 300)}`));
        try { resolve(JSON.parse(d)); } catch { reject(new Error(`JSON parse: ${d.substring(0, 100)}`)); }
      });
    }).on('error', reject);
  });
}

function httpJson(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data   = body ? JSON.stringify(body) : '';
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 300)}`));
        try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

function fsGet(pathStr, idToken) {
  return httpJson('GET', `${FS_BASE}${pathStr}`, null, { 'Authorization': `Bearer ${idToken}` });
}

// PATCH con updateMask: solo toca los campos indicados, NO borra el resto del documento
function fsPatch(pathStr, fields, idToken) {
  const mask = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  return httpJson('PATCH', `${FS_BASE}${pathStr}?${mask}`, { fields }, { 'Authorization': `Bearer ${idToken}` });
}

// Ejecuta una query estructurada (runQuery)
function fsQuery(structuredQuery, idToken) {
  return httpJson('POST', `${FS_BASE}:runQuery`, { structuredQuery }, { 'Authorization': `Bearer ${idToken}` });
}

// ── Conversión de valores Firestore ────────────────────────────────────────────
const sv = v =>
  v === null || v === undefined ? { nullValue: null } :
  typeof v === 'string'  ? { stringValue: v }  :
  typeof v === 'boolean' ? { booleanValue: v } :
  typeof v === 'number'  ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) :
  { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sv(x)])) } };

function fromValue(v) {
  if (!v) return null;
  if ('stringValue'  in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue'  in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue'    in v) return null;
  if ('mapValue'     in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fromValue(x)]));
  if ('arrayValue'   in v) return (v.arrayValue.values ?? []).map(fromValue);
  return null;
}

function fromDoc(doc) {
  const r = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) r[k] = fromValue(v);
  return r;
}

// ── Autenticación ──────────────────────────────────────────────────────────────
async function getIdToken() {
  console.log(`🔐 Autenticando como ${ADMIN_EMAIL}...`);
  const res = await httpJson('POST',
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASS, returnSecureToken: true });
  if (!res.idToken) throw new Error('No se obtuvo idToken');
  console.log('   ✅ Autenticado');
  return res.idToken;
}

// ── Puntos (misma lógica que la app) ──────────────────────────────────────────
function calcPts(ph, pa, ah, aa) {
  if (ph === ah && pa === aa)          return { points: 15, result: 'EXACT' };
  const pd = ph - pa, ad = ah - aa;
  if (pd === ad)                       return { points: 10, result: 'GOAL_DIFF' };
  if (Math.sign(pd) === Math.sign(ad)) return { points: 5,  result: 'TENDENCY' };
  return { points: 0, result: 'WRONG' };
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🔄 Sync resultados — ${new Date().toISOString()}`);

  const idToken = await getIdToken();

  // 1. Partidos finalizados desde la API
  const api = await httpGet(
    `https://api.football-data.org/v4/competitions/${COMPETITION}/matches?status=FINISHED`,
    { 'X-Auth-Token': FOOTBALL_KEY });
  const finished = api.matches ?? [];
  console.log(`📡 ${finished.length} partidos finalizados en la API`);

  if (finished.length === 0) { console.log('✅ Nada que procesar.'); return; }

  // 2. Traer TODAS las predicciones una sola vez (runQuery, sin límite de 500)
  const predRows = await fsQuery({ from: [{ collectionId: 'predictions' }] }, idToken);
  const allPreds = predRows
    .filter(r => r.document)
    .map(r => ({ _id: r.document.name.split('/').pop(), ...fromDoc(r.document) }));
  console.log(`📋 ${allPreds.length} predicciones en total`);

  // 2b. Mapa matchId → fase ('group' | 'knockout'), normalizando nombres de etapa
  const normStage = s => s === 'LAST_32' ? 'ROUND_OF_32' : s === 'LAST_16' ? 'ROUND_OF_16' : (s ?? 'GROUP_STAGE');
  const matchRows = await fsQuery({ from: [{ collectionId: 'matches' }] }, idToken);
  const phaseByMatch = new Map();
  matchRows.filter(r => r.document).forEach(r => {
    const id    = r.document.name.split('/').pop();
    const stage = normStage(fromDoc(r.document).stage);
    phaseByMatch.set(String(id), stage === 'GROUP_STAGE' ? 'group' : 'knockout');
  });

  const affectedUsers = new Set();
  let updatedMatches = 0, calculatedPreds = 0;

  for (const m of finished) {
    const home = m.score?.fullTime?.home;
    const away = m.score?.fullTime?.away;
    if (home == null || away == null) continue;

    // 3. Actualizar el partido (solo status, score y lastUpdated — el resto queda intacto)
    await fsPatch(`/matches/${m.id}`, {
      status: sv('FINISHED'),
      score:  sv({
        winner:   home > away ? 'HOME_TEAM' : away > home ? 'AWAY_TEAM' : 'DRAW',
        fullTime: { home, away },
        halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null },
      }),
      lastUpdated: sv(new Date().toISOString()),
    }, idToken);
    updatedMatches++;

    // 4. Calcular predicciones pendientes de este partido
    const pending = allPreds.filter(p => Number(p.matchId) === Number(m.id) && !p.calculated);
    for (const p of pending) {
      const { points, result } = calcPts(Number(p.predictedHome), Number(p.predictedAway), home, away);
      await fsPatch(`/predictions/${p._id}`, {
        points:     sv(points),
        result:     sv(result),
        calculated: sv(true),
        updatedAt:  sv(new Date().toISOString()),
      }, idToken);
      // Actualizar copia local para recalcular totales después
      p.points = points; p.result = result; p.calculated = true;
      affectedUsers.add(p.userId);
      calculatedPreds++;
      console.log(`   ⚽ ${m.homeTeam?.tla} ${home}-${away} ${m.awayTeam?.tla} → ${p.userId.substring(0, 6)}…: ${result} (+${points})`);
    }
  }

  // 5. Recalcular totales de los usuarios afectados (una vez cada uno)
  for (const uid of affectedUsers) {
    const userPreds = allPreds.filter(p => p.userId === uid && p.calculated);
    const total    = userPreds.reduce((s, p) => s + Number(p.points ?? 0), 0);
    const group    = userPreds
      .filter(p => phaseByMatch.get(String(p.matchId)) !== 'knockout')
      .reduce((s, p) => s + Number(p.points ?? 0), 0);
    await fsPatch(`/users/${uid}`, {
      totalPoints:    sv(total),
      groupPoints:    sv(group),
      knockoutPoints: sv(total - group),
      exactScores:    sv(userPreds.filter(p => p.result === 'EXACT').length),
      correctWinners: sv(userPreds.filter(p => p.result === 'TENDENCY' || p.result === 'GOAL_DIFF').length),
      updatedAt:      sv(new Date().toISOString()),
    }, idToken);
    console.log(`   👤 Totales actualizados: ${uid.substring(0, 6)}… (grupos:${group} elim:${total - group})`);
  }

  console.log(`\n✅ Listo. ${updatedMatches} partidos actualizados, ${calculatedPreds} predicciones calculadas, ${affectedUsers.size} usuarios.`);
}

main().catch(e => { console.error('❌ Error fatal:', e.message); process.exit(1); });
