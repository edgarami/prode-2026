import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, getDoc, getDocs, setDoc,
  updateDoc, query, where, arrayUnion, arrayRemove, orderBy,
} from '@angular/fire/firestore';
import { League } from '../models';
import { RankingEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private firestore = inject(Firestore);

  // ── Obtener todas las ligas ────────────────────────────────────────────────
  async getLeagues(): Promise<League[]> {
    const snap = await getDocs(collection(this.firestore, 'leagues'));
    return snap.docs.map(d => this.mapDoc(d.id, d.data()));
  }

  // ── Obtener liga por código de invitación ──────────────────────────────────
  async getLeagueByCode(code: string): Promise<League | null> {
    const q    = query(collection(this.firestore, 'leagues'), where('code', '==', code.toUpperCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return this.mapDoc(d.id, d.data());
  }

  // ── Obtener liga default ───────────────────────────────────────────────────
  async getDefaultLeague(): Promise<League | null> {
    const q    = query(collection(this.firestore, 'leagues'), where('isDefault', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return this.mapDoc(d.id, d.data());
  }

  // ── Obtener ligas de un usuario ────────────────────────────────────────────
  async getUserLeagues(leagueIds: string[]): Promise<League[]> {
    if (!leagueIds.length) return [];
    const results = await Promise.all(
      leagueIds.map(id => getDoc(doc(this.firestore, 'leagues', id)))
    );
    return results
      .filter(d => d.exists())
      .map(d => this.mapDoc(d.id, d.data()!));
  }

  // ── Crear liga (solo admin) ────────────────────────────────────────────────
  async createLeague(name: string, createdBy: string, isDefault = false): Promise<League> {
    const id   = doc(collection(this.firestore, 'leagues')).id;
    const code = isDefault ? 'MANO2026' : this.generateCode();
    const now  = new Date().toISOString();
    const data = {
      name, code, createdBy, isDefault,
      memberCount: 0,
      createdAt: now,
    };
    await setDoc(doc(this.firestore, 'leagues', id), data);
    return this.mapDoc(id, data);
  }

  // ── Unirse a una liga (agregar leagueId al array del usuario) ─────────────
  async joinLeague(userId: string, leagueId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', userId), {
      leagues: arrayUnion(leagueId),
    });
    // Incrementar memberCount
    const leagueRef = doc(this.firestore, 'leagues', leagueId);
    const snap      = await getDoc(leagueRef);
    if (snap.exists()) {
      const current = snap.data()['memberCount'] ?? 0;
      await updateDoc(leagueRef, { memberCount: current + 1 });
    }
  }

  // ── Salir de una liga ──────────────────────────────────────────────────────
  async leaveLeague(userId: string, leagueId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', userId), {
      leagues: arrayRemove(leagueId),
    });
    const leagueRef = doc(this.firestore, 'leagues', leagueId);
    const snap      = await getDoc(leagueRef);
    if (snap.exists()) {
      const current = snap.data()['memberCount'] ?? 1;
      await updateDoc(leagueRef, { memberCount: Math.max(0, current - 1) });
    }
  }

  // ── Ranking filtrado por liga ──────────────────────────────────────────────
  // Consultamos usuarios que tienen el leagueId en su array 'leagues'
  // y ordenamos en memoria (evita índices compuestos)
  async getRankingByLeague(leagueId: string): Promise<RankingEntry[]> {
    const q    = query(
      collection(this.firestore, 'users'),
      where('leagues', 'array-contains', leagueId)
    );
    const snap = await getDocs(q);
    const entries: RankingEntry[] = snap.docs.map(d => {
      const data = d.data();
      return {
        rank:           0,
        userId:         d.id,
        displayName:    data['displayName']    ?? 'Usuario',
        photoURL:       data['photoURL']       ?? null,
        country:        data['country']        ?? '',
        totalPoints:    data['totalPoints']    ?? 0,
        groupPoints:    data['groupPoints']    ?? 0,
        knockoutPoints: data['knockoutPoints'] ?? 0,
        exactScores:    data['exactScores']    ?? 0,
        correctWinners: data['correctWinners'] ?? 0,
        predictions:    data['predictions']    ?? 0,
      };
    });
    // Ordenar por puntos generales desc, asignar rank (el orden por fase se hace en la UI)
    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    entries.forEach((e, i) => e.rank = i + 1);
    return entries;
  }

  // ── Generar código aleatorio ───────────────────────────────────────────────
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private mapDoc(id: string, d: any): League {
    return {
      id,
      name:        d['name']        ?? '',
      code:        d['code']        ?? '',
      createdBy:   d['createdBy']   ?? '',
      createdAt:   new Date(d['createdAt']),
      memberCount: d['memberCount'] ?? 0,
      isDefault:   d['isDefault']   ?? false,
    };
  }
}
