import { Injectable, inject } from '@angular/core';
import {
  Firestore, doc, getDoc, setDoc, updateDoc,
  collection, query, orderBy, limit, getDocs,
} from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { UserProfile, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    if (!snap.exists()) return null;
    return this.mapDoc(snap.id, snap.data());
  }

  async createUserProfile(user: User, displayName: string, leagueIds: string[] = []): Promise<UserProfile> {
    const now  = new Date().toISOString();
    const data = {
      uid: user.uid, displayName, email: user.email ?? '',
      photoURL: user.photoURL ?? null, country: 'Argentina',
      totalPoints: 0, exactScores: 0, correctWinners: 0, rank: 0,
      role: 'user' as UserRole, createdAt: now, updatedAt: now,
      leagues: leagueIds,
    };
    await setDoc(doc(this.firestore, 'users', user.uid), data);
    return { ...data, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  async updateUserProfile(uid: string, data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'country'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), { ...data, updatedAt: new Date().toISOString() });
  }

  async getTopUsers(limitCount = 10): Promise<UserProfile[]> {
    const q    = query(collection(this.firestore, 'users'), orderBy('totalPoints', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.mapDoc(d.id, d.data()));
  }

  async updateUserPoints(uid: string, points: number, exactScores: number, correctWinners: number): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), {
      totalPoints: points, exactScores, correctWinners, updatedAt: new Date().toISOString(),
    });
  }

  private mapDoc(id: string, d: any): UserProfile {
    return {
      uid: id, displayName: d['displayName'] ?? '', email: d['email'] ?? '',
      photoURL: d['photoURL'] ?? null, country: d['country'] ?? 'Argentina',
      totalPoints: d['totalPoints'] ?? 0, exactScores: d['exactScores'] ?? 0,
      correctWinners: d['correctWinners'] ?? 0, rank: d['rank'] ?? 0,
      role: d['role'] ?? 'user',
      leagues: d['leagues'] ?? [],
      createdAt: new Date(d['createdAt']), updatedAt: new Date(d['updatedAt']),
    };
  }
}
