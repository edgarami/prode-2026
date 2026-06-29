#!/usr/bin/env node
/**
 * add-prediction.js — Carga la predicción de un usuario a mano (backfill) y calcula puntos.
 *
 * Uso:
 *   node scripts/add-prediction.js <email> <matchId> <golesLocal> <golesVisitante>
 * Ejemplo:
 *   node scripts/add-prediction.js juan@mail.com 537417 2 1
 *
 * Requiere .env.local con FIREBASE_PROJECT_ID, FIREBASE_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
 */
'use strict';
const https = require('https'), fs = require('fs'), path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
  const i = l.indexOf('='); if (i > 0) { const k = l.slice(0, i).trim(); const v = l.slice(i + 1).trim(); if (k && v && !process.env[k]) process.env[k] = v; }
});

const FB_PROJECT = process.env.FIREBASE_PROJECT_ID, FB_API_KEY = process.env.FIREBASE_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL, ADMIN_PASS = process.env.ADMIN_PASSWORD;

const [email, matchIdArg, homeArg, awayArg] = process.argv.slice(2);
if (!email || !matchIdArg || homeArg === undefined || awayArg === undefined) {
  console.error('Uso: node scripts/add-prediction.js <email> <matchId> <golesLocal> <golesVisitante>');
  process.exit(1);
}
const matchId = String(matchIdArg), ph = Number(homeArg), pa = Number(awayArg);

function req(method, url, body, headers = {}) {
  return new Promise((res, rej) => {
    const d = body ? JSON.stringify(body) : ''; const u = new URL(url);
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', ...(d ? { 'Content-Length': Buffer.byteLength(d) } : {}), ...headers } },
      x => { let o = ''; x.on('data', c => o += c); x.on('end', () => { if (x.statusCode >= 400) return rej(new Error(`HTTP ${x.statusCode}: ${o.slice(0,300)}`)); res(o ? JSON.parse(o) : {}); }); });
    r.on('error', rej); if (d) r.write(d); r.end();
  });
}
const sv = v => v === null ? { nullValue: null } : typeof v === 'string' ? { stringValue: v } : typeof v === 'boolean' ? { booleanValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
function fromValue(v){ if(!v)return null; if('stringValue'in v)return v.stringValue; if('integerValue'in v)return Number(v.integerValue); if('doubleValue'in v)return v.doubleValue; if('booleanValue'in v)return v.booleanValue; if('mapValue'in v)return Object.fromEntries(Object.entries(v.mapValue.fields??{}).map(([k,x])=>[k,fromValue(x)])); if('arrayValue'in v)return(v.arrayValue.values??[]).map(fromValue); return null; }
const fromDoc = d => Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]) => [k, fromValue(v)]));
const norm = s => s === 'LAST_32' ? 'ROUND_OF_32' : s === 'LAST_16' ? 'ROUND_OF_16' : (s || 'GROUP_STAGE');
function calcPts(ph, pa, ah, aa) {
  if (ph === ah && pa === aa) return { points: 15, result: 'EXACT' };
  const pd = ph - pa, ad = ah - aa;
  if (pd === ad) return { points: 10, result: 'GOAL_DIFF' };
  if (Math.sign(pd) === Math.sign(ad)) return { points: 5, result: 'TENDENCY' };
  return { points: 0, result: 'WRONG' };
}

(async () => {
  const auth = await req('POST', `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASS, returnSecureToken: true });
  const tok = auth.idToken, H = { Authorization: 'Bearer ' + tok };
  const base = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;
  const query = sq => req('POST', `${base}:runQuery`, { structuredQuery: sq }, H);

  // Buscar usuario por email
  const ures = await query({ from: [{ collectionId: 'users' }], where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } } });
  const udoc = ures.find(r => r.document);
  if (!udoc) { console.error(`❌ No se encontró usuario con email ${email}`); process.exit(1); }
  const uid = udoc.document.name.split('/').pop();
  const uname = fromDoc(udoc.document).displayName;

  // Traer el partido
  const m = fromDoc(await req('GET', `${base}/matches/${matchId}`, null, H));
  const home = m.homeTeam?.shortName || m.homeTeam?.name, away = m.awayTeam?.shortName || m.awayTeam?.name;
  console.log(`👤 ${uname} (${email})`);
  console.log(`⚽ ${home} vs ${away} — estado: ${m.status}`);
  console.log(`📝 Predicción a cargar: ${ph}-${pa}`);

  // Crear la predicción
  const predId = `${uid}_${matchId}`, now = new Date().toISOString();
  let points = 0, result = 'PENDING', calculated = false;
  const ah = m.score?.fullTime?.home, aa = m.score?.fullTime?.away;
  if (m.status === 'FINISHED' && ah != null && aa != null) {
    ({ points, result } = calcPts(ph, pa, ah, aa)); calculated = true;
    console.log(`   Resultado real ${ah}-${aa} → ${result} (+${points})`);
  }
  await req('PATCH', `${base}/predictions/${predId}`, { fields: {
    id: sv(predId), userId: sv(uid), matchId: sv(Number(matchId)),
    predictedHome: sv(ph), predictedAway: sv(pa),
    points: sv(points), result: sv(result), calculated: sv(calculated),
    createdAt: sv(now), updatedAt: sv(now),
  } }, H);
  console.log('   ✅ Predicción guardada');

  // Recalcular totales del usuario (por fase)
  if (calculated) {
    const preds = (await query({ from: [{ collectionId: 'predictions' }], where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: uid } } } }))
      .filter(r => r.document).map(r => fromDoc(r.document)).filter(p => p.calculated);
    const matchRows = await query({ from: [{ collectionId: 'matches' }] });
    const phase = new Map(matchRows.filter(r => r.document).map(r => { const f = fromDoc(r.document); return [String(f.id ?? r.document.name.split('/').pop()), norm(f.stage) === 'GROUP_STAGE' ? 'group' : 'knockout']; }));
    const total = preds.reduce((s, p) => s + Number(p.points || 0), 0);
    const group = preds.filter(p => phase.get(String(p.matchId)) !== 'knockout').reduce((s, p) => s + Number(p.points || 0), 0);
    await req('PATCH', `${base}/users/${uid}?updateMask.fieldPaths=totalPoints&updateMask.fieldPaths=groupPoints&updateMask.fieldPaths=knockoutPoints&updateMask.fieldPaths=exactScores&updateMask.fieldPaths=correctWinners`, { fields: {
      totalPoints: sv(total), groupPoints: sv(group), knockoutPoints: sv(total - group),
      exactScores: sv(preds.filter(p => p.result === 'EXACT').length),
      correctWinners: sv(preds.filter(p => p.result === 'TENDENCY' || p.result === 'GOAL_DIFF').length),
    } }, H);
    console.log(`   ✅ Totales recalculados (grupos:${group} elim:${total - group} total:${total})`);
  } else {
    console.log('   ℹ️ El partido aún no terminó: los puntos se calcularán cuando se cargue el resultado.');
  }
  console.log('\n🎉 Listo.');
})().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
