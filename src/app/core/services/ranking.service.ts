import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, orderBy, getDocs, limit,
} from '@angular/fire/firestore';
import { RankingEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private firestore = inject(Firestore);

  // Usa un solo orderBy para evitar requerir índices compuestos en Firestore
  async getRanking(
    pageSize = 20,
  ): Promise<{ entries: RankingEntry[] }> {
    const q    = query(
      collection(this.firestore, 'users'),
      orderBy('totalPoints', 'desc'),
      limit(pageSize),
    );
    const snap = await getDocs(q);
    const entries: RankingEntry[] = snap.docs.map((d, i) => {
      const data = d.data();
      return {
        rank:           i + 1,
        userId:         d.id,
        displayName:    data['displayName']    ?? 'Usuario',
        photoURL:       data['photoURL']       ?? null,
        country:        data['country']        ?? '',
        totalPoints:    data['totalPoints']    ?? 0,
        exactScores:    data['exactScores']    ?? 0,
        correctWinners: data['correctWinners'] ?? 0,
        predictions:    data['predictions']    ?? 0,
      };
    });
    return { entries };
  }

  async getTopThree(): Promise<RankingEntry[]> {
    const result = await this.getRanking(3);
    return result.entries;
  }

  async getUserRank(userId: string): Promise<number> {
    // Cuenta cuántos usuarios tienen más puntos
    const q    = query(collection(this.firestore, 'users'), orderBy('totalPoints', 'desc'));
    const snap = await getDocs(q);
    const idx  = snap.docs.findIndex(d => d.id === userId);
    return idx === -1 ? 0 : idx + 1;
  }
}
