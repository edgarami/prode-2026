#!/usr/bin/env node
/**
 * sync-firestore.js — Sincroniza TODO desde football-data.org → Firestore
 *
 * Uso:
 *   node scripts/sync-firestore.js              (todo)
 *   node scripts/sync-firestore.js --standings  (solo tabla de grupos)
 *   node scripts/sync-firestore.js --matches    (solo partidos)
 *
 * Requiere .env.local con:
 *   FOOTBALL_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_API_KEY
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 */
'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Cargar .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim();
      if (k && v) process.env[k] = v;
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
  console.error('❌ Faltan variables en .env.local:');
  console.error('   FOOTBALL_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_API_KEY');
  console.error('   ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const args          = process.argv.slice(2);
const onlyStandings = args.includes('--standings');
const onlyMatches   = args.includes('--matches');
const doAll         = !onlyStandings && !onlyMatches;

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

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data   = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { reject(new Error(`JSON parse: ${d.substring(0, 100)}`)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function firestorePatch(path, fields, idToken) {
  return new Promise((resolve, reject) => {
    const body   = JSON.stringify({ fields });
    const url    = new URL(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents${path}?key=${FB_API_KEY}`
    );
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'PATCH',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization':  `Bearer ${idToken}`,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => res.statusCode >= 400
        ? reject(new Error(`Firestore ${res.statusCode}: ${d.substring(0, 300)}`))
        : resolve()
      );
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Convertir objeto JS a campos Firestore
function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null };
    } else if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    } else if (typeof v === 'number') {
      fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFields(v) } };
    }
  }
  return fields;
}

// ── Autenticación Firebase ─────────────────────────────────────────────────────
async function getIdToken() {
  console.log(`   Autenticando como ${ADMIN_EMAIL}...`);
  const res = await httpPost(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASS, returnSecureToken: true }
  );
  if (res.error) throw new Error(`Auth error: ${res.error.message}`);
  console.log('   ✅ Autenticado correctamente');
  return res.idToken;
}

// ── Sync standings ─────────────────────────────────────────────────────────────
async function syncStandings(idToken) {
  console.log('\n📊 Sincronizando tabla de posiciones...');
  const res = await httpGet(
    `https://api.football-data.org/v4/competitions/${COMPETITION}/standings`,
    { 'X-Auth-Token': FOOTBALL_KEY }
  );
  const groups = (res.standings ?? []).filter(s => s.group && s.type === 'TOTAL');
  console.log(`   ${groups.length} grupos encontrados`);

  await firestorePatch('/standings/groups', {
    data:      { stringValue: JSON.stringify(groups) },
    updatedAt: { stringValue: new Date().toISOString() },
  }, idToken);

  console.log('   ✅ Tabla guardada en Firestore');
}

// ── Sync partidos ──────────────────────────────────────────────────────────────
async function syncMatches(idToken) {
  console.log('\n⚽ Sincronizando partidos...');
  const res = await httpGet(
    `https://api.football-data.org/v4/competitions/${COMPETITION}/matches`,
    { 'X-Auth-Token': FOOTBALL_KEY }
  );
  const matches = res.matches ?? [];
  console.log(`   ${matches.length} partidos encontrados`);

  const team = t => ({
    id: t.id, name: t.name,
    shortName: t.shortName ?? t.name,
    tla: t.tla ?? (t.name ?? '???').substring(0, 3).toUpperCase(),
    crest: t.crest ?? '',
  });

  // La API usa LAST_32 / LAST_16; los normalizamos a ROUND_OF_32 / ROUND_OF_16
  const normStage = s => s === 'LAST_32' ? 'ROUND_OF_32' : s === 'LAST_16' ? 'ROUND_OF_16' : (s ?? 'GROUP_STAGE');

  let i = 0;
  for (const m of matches) {
    const matchDoc = {
      id: m.id, utcDate: m.utcDate,
      status: m.status, stage: normStage(m.stage),
      group: m.group ?? null, matchday: m.matchday ?? 0,
      homeTeam: team(m.homeTeam), awayTeam: team(m.awayTeam),
      score: {
        winner:   m.score?.winner   ?? null,
        fullTime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
        halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null },
      },
      lastUpdated: new Date().toISOString(),
    };
    await firestorePatch(`/matches/${m.id}`, toFields(matchDoc), idToken);
    i++;
    if (i % 10 === 0) process.stdout.write(`   ${i}/${matches.length} partidos...\r`);
  }
  console.log(`   ✅ ${i} partidos guardados en Firestore         `);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🚀 Sync iniciado — ${new Date().toLocaleString('es-AR')}`);
  console.log(`   Proyecto: ${FB_PROJECT}`);

  const idToken = await getIdToken();

  if (doAll || onlyStandings) await syncStandings(idToken);
  if (doAll || onlyMatches)   await syncMatches(idToken);

  console.log('\n🎉 Sincronización completada exitosamente.');
}

main().catch(e => { console.error('\n❌ Error:', e.message); process.exit(1); });
