import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, orderBy, getDocs,
  doc, getDoc, setDoc, updateDoc, where,
} from '@angular/fire/firestore';
import { Match, MatchDoc, MatchStatus, MatchStage } from '../models';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private firestore = inject(Firestore);

  async getAllMatches(): Promise<Match[]> {
    const q    = query(collection(this.firestore, 'matches'), orderBy('utcDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.map(d.data() as MatchDoc));
  }

  async getMatchById(id: number): Promise<Match | null> {
    const snap = await getDoc(doc(this.firestore, 'matches', id.toString()));
    return snap.exists() ? this.map(snap.data() as MatchDoc) : null;
  }

  async getTodayMatches(): Promise<Match[]> {
    // Trae todos y filtra en memoria para evitar índices compuestos
    const all = await this.getAllMatches();
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return all.filter(m => m.utcDate >= start && m.utcDate < end);
  }

  async getUpcomingMatches(count = 5): Promise<Match[]> {
    const all = await this.getAllMatches();
    const now  = new Date();
    const NON_PLAYABLE: MatchStatus[] = ['FINISHED', 'CANCELLED', 'POSTPONED'];
    return all
      .filter(m => {
        const matchDate = m.utcDate instanceof Date ? m.utcDate : new Date(m.utcDate);
        return matchDate > now && !NON_PLAYABLE.includes(m.status);
      })
      .slice(0, count);
  }

  async getNextBigMatch(): Promise<Match | null> {
    const upcoming = await this.getUpcomingMatches(1);
    return upcoming[0] ?? null;
  }

  async getLiveMatches(): Promise<Match[]> {
    const q    = query(
      collection(this.firestore, 'matches'),
      where('status', 'in', ['IN_PLAY', 'PAUSED']),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => this.map(d.data() as MatchDoc));
  }

  async upsertMatch(match: MatchDoc): Promise<void> {
    await setDoc(doc(this.firestore, 'matches', match.id.toString()), match, { merge: true });
  }

  async updateMatchResult(matchId: number, homeScore: number, awayScore: number): Promise<void> {
    const winner = homeScore > awayScore ? 'HOME_TEAM' : awayScore > homeScore ? 'AWAY_TEAM' : 'DRAW';
    await updateDoc(doc(this.firestore, 'matches', matchId.toString()), {
      'score.fullTime.home': homeScore,
      'score.fullTime.away': awayScore,
      'score.winner':        winner,
      status:                'FINISHED' as MatchStatus,
      lastUpdated:           new Date().toISOString(),
    });
  }

  canPredict(match: Match): boolean {
    if (match.status !== 'TIMED' && match.status !== 'SCHEDULED') return false;
    const cutoff = new Date(new Date(match.utcDate).getTime() - 30 * 60 * 1000);
    return new Date() < cutoff;
  }

  getMinutesUntilCutoff(match: Match): number {
    const cutoff = new Date(new Date(match.utcDate).getTime() - 30 * 60 * 1000);
    return Math.floor((cutoff.getTime() - Date.now()) / 60000);
  }

  private map(d: MatchDoc): Match {
    // utcDate puede llegar como string ISO, Timestamp de Firestore o Date
    const toDate = (v: any): Date => {
      if (v instanceof Date)           return v;
      if (v?.toDate)                   return v.toDate();   // Firestore Timestamp
      if (typeof v === 'string')       return new Date(v);
      return new Date();
    };
    return {
      ...d,
      utcDate:     toDate(d.utcDate),
      lastUpdated: toDate(d.lastUpdated),
    };
  }
}
