import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, getDocs,
  doc, setDoc, updateDoc, getDoc,
} from '@angular/fire/firestore';
import { Prediction, PredictionDoc, calculatePoints, Match } from '../models';
import { MatchService } from './match.service';
import { UserService }  from './user.service';

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private firestore    = inject(Firestore);
  private matchService = inject(MatchService);
  private userService  = inject(UserService);

  private id(userId: string, matchId: number): string {
    return `${userId}_${matchId}`;
  }

  async getPredictionByMatch(userId: string, matchId: number): Promise<Prediction | null> {
    const snap = await getDoc(doc(this.firestore, 'predictions', this.id(userId, matchId)));
    return snap.exists() ? this.map(snap.data() as PredictionDoc) : null;
  }

  async getUserPredictions(userId: string): Promise<Prediction[]> {
    const q    = query(collection(this.firestore, 'predictions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.map(d.data() as PredictionDoc));
  }

  async getPredictionsByMatch(matchId: number): Promise<Prediction[]> {
    const q    = query(collection(this.firestore, 'predictions'), where('matchId', '==', matchId));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.map(d.data() as PredictionDoc));
  }

  async savePrediction(userId: string, match: Match, predictedHome: number, predictedAway: number): Promise<void> {
    if (!this.matchService.canPredict(match)) {
      throw new Error('El plazo para predecir este partido ha cerrado.');
    }
    const id  = this.id(userId, match.id);
    const now = new Date().toISOString();
    const existing = await this.getPredictionByMatch(userId, match.id);
    const data: PredictionDoc = {
      id, userId, matchId: match.id, predictedHome, predictedAway,
      points: 0, result: 'PENDING', calculated: false,
      createdAt: existing?.createdAt.toISOString() ?? now,
      updatedAt: now,
    };
    await setDoc(doc(this.firestore, 'predictions', id), data);
  }

  async calculateMatchPredictions(matchId: number, actualHome: number, actualAway: number): Promise<void> {
    const predictions = await this.getPredictionsByMatch(matchId);
    const affectedUsers = new Set<string>();

    await Promise.all(predictions.map(async (pred) => {
      if (pred.calculated) return;
      const { points, result } = calculatePoints(pred.predictedHome, pred.predictedAway, actualHome, actualAway);
      await updateDoc(doc(this.firestore, 'predictions', pred.id), {
        points, result, calculated: true, updatedAt: new Date().toISOString(),
      });
      affectedUsers.add(pred.userId);
    }));

    await Promise.all([...affectedUsers].map(uid => this.recalculateUserTotals(uid)));
  }

  async recalculateUserTotals(userId: string): Promise<void> {
    const preds      = (await this.getUserPredictions(userId)).filter(p => p.calculated);
    const totalPoints    = preds.reduce((s, p) => s + p.points, 0);
    const exactScores    = preds.filter(p => p.result === 'EXACT').length;
    const correctWinners = preds.filter(p => p.result === 'TENDENCY' || p.result === 'GOAL_DIFF').length;
    await this.userService.updateUserPoints(userId, totalPoints, exactScores, correctWinners);
  }

  private map(d: PredictionDoc): Prediction {
    return { ...d, createdAt: new Date(d.createdAt), updatedAt: new Date(d.updatedAt) };
  }
}
