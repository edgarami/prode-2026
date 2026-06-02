#!/usr/bin/env node
/**
 * sync-results.js — Sincroniza resultados de football-data.org → Firestore
 * y recalcula puntos de predicciones.
 *
 * Variables de entorno necesarias:
 *   FOOTBALL_API_KEY    → Token de football-data.org
 *   FIREBASE_PROJECT_ID → ID del proyecto Firebase
 *   FIREBASE_API_KEY    → API Key pública de Firebase (para REST API)
 *
 * Ejecutar: node scripts/sync-results.js
 */
'use strict';

const https = require('https');

const FOOTBALL_API_KEY  = process.env.FOOTBALL_API_KEY;
const FIREBASE_PROJECT  = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY  = process.env.FIREBASE_API_KEY;
const COMPETITION_CODE  = 'WC';

if (!FOOTBALL_API_KEY || !FIREBASE_PROJECT || !FIREBASE_API_KEY) {
  console.error('❌ Faltan variables de entorno: FOOTBALL_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_API_KEY');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WCP/1.0', ...headers } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => res.statusCode >= 400 ? reject(new Error(`HTTP ${res.statusCode}: ${d}`)) : resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function firestoreGet(path) {
  return get(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents${path}?key=${FIREBASE_API_KEY}`);
}

function firestorePatch(path, fields) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ fields });
    const url  = new URL(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents${path}?key=${FIREBASE_API_KEY}`);
    const req  = https.request({ hostname: url.hostname, path: url.pathname + url.search, method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => res.statusCode >= 400 ? reject(new Error(`Firestore ${res.statusCode}: ${d}`)) : resolve({}));
      });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sv = v => typeof v === 'string'  ? { stringValue: v }   :
               typeof v === 'number'  ? { integerValue: v }  :
               typeof v === 'boolean' ? { booleanValue: v }  : { nullValue: null };

function fromDoc(doc) {
  const r = {};
  for (const [k, v] of Object.entries(doc.fields ?? {}))
    r[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.nullValue ?? null;
  return r;
}

// ── Puntos ─────────────────────────────────────────────────────────────────────
function calcPts(ph, pa, ah, aa) {
  if (ph === ah && pa === aa) return { points: 15, result: 'EXACT' };
  const pd = ph - pa, ad = ah - aa;
  if (pd === ad)                    return { points: 10, result: 'GOAL_DIFF' };
  if (Math.sign(pd) === Math.sign(ad)) return { points: 5, result: 'TENDENCY' };
  return { points: 0, result: 'WRONG' };
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🔄 Iniciando sincronización — ${new Date().toISOString()}`);

  // 1. Traer partidos finalizados
  const api = await get(
    `https://api.football-data.org/v4/competitions/${COMPETITION_CODE}/matches?status=FINISHED`,
    { 'X-Auth-Token': FOOTBALL_API_KEY },
  );
  const finished = api.matches ?? [];
  console.log(`📡 ${finished.length} partidos finalizados desde la API.`);

  let processed = 0;
  for (const m of finished) {
    const home = m.score?.fullTime?.home, away = m.score?.fullTime?.away;
    if (home === null || away === null || home === undefined || away === undefined) continue;

    console.log(`⚽ ${m.id}: ${m.homeTeam?.tla} ${home}-${away} ${m.awayTeam?.tla}`);

    // 2. Actualizar match en Firestore
    await firestorePatch(`/matches/${m.id}`, {
      status:              sv('FINISHED'),
      'score.fullTime.home': sv(home),
      'score.fullTime.away': sv(away),
      'score.winner':      sv(home > away ? 'HOME_TEAM' : away > home ? 'AWAY_TEAM' : 'DRAW'),
      lastUpdated:         sv(new Date().toISOString()),
    }).catch(e => console.warn(`   ⚠️ match update: ${e.message}`));

    // 3. Predicciones no calculadas de este partido
    const predsResp = await firestoreGet(`/predictions?pageSize=500`).catch(() => ({ documents: [] }));
    const preds = (predsResp.documents ?? [])
      .map(d => ({ id: d.name?.split('/').pop(), ...fromDoc(d) }))
      .filter(p => String(p.matchId) === String(m.id) && !p.calculated);

    console.log(`   ${preds.length} predicciones a calcular`);

    const users = new Set();
    for (const p of preds) {
      const { points, result } = calcPts(Number(p.predictedHome), Number(p.predictedAway), home, away);
      await firestorePatch(`/predictions/${p.id}`, {
        points:     sv(points),
        result:     sv(result),
        calculated: sv(true),
        updatedAt:  sv(new Date().toISOString()),
      }).catch(e => console.warn(`   ⚠️ pred ${p.id}: ${e.message}`));
      users.add(p.userId);
      console.log(`   → user ${p.userId}: ${result} (+${points})`);
    }

    // 4. Recalcular totales de usuarios
    for (const uid of users) {
      const all = await firestoreGet(`/predictions?pageSize=1000`).catch(() => ({ documents: [] }));
      const up  = (all.documents ?? []).map(d => fromDoc(d)).filter(p => p.userId === uid && p.calculated);
      await firestorePatch(`/users/${uid}`, {
        totalPoints:    sv(up.reduce((s, p) => s + Number(p.points), 0)),
        exactScores:    sv(up.filter(p => p.result === 'EXACT').length),
        correctWinners: sv(up.filter(p => p.result === 'TENDENCY' || p.result === 'GOAL_DIFF').length),
        updatedAt:      sv(new Date().toISOString()),
      }).catch(e => console.warn(`   ⚠️ user ${uid}: ${e.message}`));
    }

    processed++;
  }

  console.log(`\n✅ Listo. ${processed} partidos procesados.`);
}

main().catch(e => { console.error('❌ Error fatal:', e); process.exit(1); });
