import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup, updateProfile,
  onAuthStateChanged, User, sendPasswordResetEmail,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth        = inject(Auth);
  private router      = inject(Router);
  private userService = inject(UserService);

  private _currentUser = signal<User | null>(null);
  private _userProfile = signal<UserProfile | null>(null);
  private _loading     = signal<boolean>(true);

  readonly currentUser = this._currentUser.asReadonly();
  readonly userProfile = this._userProfile.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._currentUser());
  readonly isAdmin     = computed(() => this._userProfile()?.role === 'admin');

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this._currentUser.set(user);
      if (user) {
        const profile = await this.userService.getUserProfile(user.uid);
        this._userProfile.set(profile);
      } else {
        this._userProfile.set(null);
      }
      this._loading.set(false);
    });
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    const cred    = await signInWithEmailAndPassword(this.auth, email, password);
    const profile = await this.userService.getUserProfile(cred.user.uid);
    this._userProfile.set(profile);
    await this.router.navigate(['/']);
  }

  async registerWithEmail(email: string, password: string, displayName: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName });
    const profile = await this.userService.createUserProfile(cred.user, displayName);
    this._userProfile.set(profile);
    await this.router.navigate(['/']);
  }

  async loginWithGoogle(): Promise<void> {
    const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
    let profile = await this.userService.getUserProfile(cred.user.uid);
    if (!profile) {
      profile = await this.userService.createUserProfile(cred.user, cred.user.displayName ?? 'Usuario');
    }
    this._userProfile.set(profile);
    await this.router.navigate(['/']);
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this._userProfile.set(null);
    await this.router.navigate(['/auth/login']);
  }

  refreshProfile(): void {
    const user = this._currentUser();
    if (user) {
      this.userService.getUserProfile(user.uid).then(p => this._userProfile.set(p));
    }
  }
}
