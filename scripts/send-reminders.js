#!/usr/bin/env node
/**
 * send-reminders.js — Envía push a los usuarios que NO cargaron su predicción,
 * para partidos que arrancan en los próximos ~30-75 minutos.
 *
 * Usa firebase-admin (Cloud Messaging). Requiere:
 *   FIREBASE_SERVICE_ACCOUNT  → JSON de la cuenta de servicio (como string, en un secret)
 *
 * Cada partido se recuerda UNA sola vez (marca match.reminderSent = true).
 *
 * Ejecutar: node scripts/send-reminders.js
 */
'use strict';

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// Cargar .env.local si existe (para correr local)
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

const SA_RAW = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!SA_RAW) {
  console.error('❌ Falta FIREBASE_SERVICE_ACCOUNT (JSON de la cuenta de servicio).');
  process.exit(1);
}

let serviceAccount;
try { serviceAccount = JSON.parse(SA_RAW); }
catch { serviceAccount = JSON.parse(fs.readFileSync(SA_RAW, 'utf8')); } // por si es una ruta

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const fcm = admin.messaging();

// Ventana de recordatorio (minutos antes del partido)
const MIN_BEFORE = 30;   // no recordar si faltan menos de esto (apuestas casi cerradas)
const MAX_BEFORE = 75;   // empezar a recordar desde ~75 min antes

async function main() {
  console.log(`🔔 Recordatorios — ${new Date().toISOString()}`);

  const now = Date.now();
  const [matchesSnap, predsSnap, usersSnap] = await Promise.all([
    db.collection('matches').get(),
    db.collection('predictions').get(),
    db.collection('users').get(),
  ]);

  // Partidos dentro de la ventana, jugables y aún no recordados
  const targetMatches = matchesSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(m => {
      if (m.reminderSent) return false;
      if (m.status !== 'TIMED' && m.status !== 'SCHEDULED') return false;
      const kickoff = new Date(m.utcDate).getTime();
      const minsTo  = (kickoff - now) / 60000;
      return minsTo >= MIN_BEFORE && minsTo <= MAX_BEFORE;
    });

  if (targetMatches.length === 0) { console.log('   Nada para recordar ahora.'); return; }

  // Set de "userId_matchId" que YA tienen predicción
  const predicted = new Set(predsSnap.docs.map(d => {
    const p = d.data();
    return `${p.userId}_${p.matchId}`;
  }));

  // Usuarios con tokens
  const users = usersSnap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0);

  let totalSent = 0;
  const badTokens = new Map(); // uid → [tokens a remover]

  for (const m of targetMatches) {
    const minsTo = Math.round((new Date(m.utcDate).getTime() - now) / 60000);
    const home   = m.homeTeam?.shortName || m.homeTeam?.name || 'Local';
    const away   = m.awayTeam?.shortName || m.awayTeam?.name || 'Visitante';

    // Usuarios que NO predijeron este partido
    const pending = users.filter(u => !predicted.has(`${u.uid}_${m.id}`));
    const tokens  = [];
    const tokenOwner = new Map();
    pending.forEach(u => u.fcmTokens.forEach(t => { tokens.push(t); tokenOwner.set(t, u.uid); }));

    if (tokens.length === 0) {
      await db.collection('matches').doc(String(m.id)).update({ reminderSent: true });
      continue;
    }

    const message = {
      notification: {
        title: `⚽ ${home} vs ${away}`,
        body:  `¡No te olvides tu pronóstico! Cierra en ${Math.max(0, minsTo - 30)} min.`,
      },
      data: { url: '/mis-apuestas' },
      tokens,
    };

    const res = await fcm.sendEachForMulticast(message);
    totalSent += res.successCount;
    console.log(`   ${home} vs ${away}: ${res.successCount}/${tokens.length} enviados (faltan ${pending.length} por predecir)`);

    // Recolectar tokens inválidos para limpiar
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          const t = tokens[i], uid = tokenOwner.get(t);
          if (!badTokens.has(uid)) badTokens.set(uid, []);
          badTokens.get(uid).push(t);
        }
      }
    });

    await db.collection('matches').doc(String(m.id)).update({ reminderSent: true });
  }

  // Limpiar tokens muertos
  for (const [uid, tokens] of badTokens) {
    await db.collection('users').doc(uid).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens),
    });
  }

  console.log(`\n✅ ${totalSent} notificaciones enviadas. ${badTokens.size} usuarios con tokens limpiados.`);
}

main().then(() => process.exit(0)).catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
