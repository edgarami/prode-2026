import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector:        'app-login',
  standalone:      true,
  imports:         [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col" style="background-color:#0d1117">
      <div class="px-6 pt-10 pb-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-2xl">⚽</span>
          <span class="text-xl font-black" style="color:#00FF66">World Cup Predictor</span>
        </div>
        <p class="text-gray-400 text-sm">Predecí. Ganá. Dominá el torneo.</p>
      </div>

      <div class="flex-1 flex items-start justify-center px-4 pt-6 pb-16">
        <div class="w-full max-w-sm">
          <div class="mb-8">
            <h1 class="text-2xl font-black text-white">Bienvenido</h1>
            <p class="text-gray-400 text-sm mt-1">Ingresá tus datos para continuar.</p>
          </div>

          <div *ngIf="error()" class="mb-4 p-3 rounded-xl text-sm text-red-400"
               style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3)">
            {{ error() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <input type="email" formControlName="email"
                class="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none transition-colors"
                style="background:#1f2940;border:1px solid #1f2940"
                placeholder="nombre@ejemplo.com"/>
              <p *ngIf="form.get('email')?.invalid && form.get('email')?.touched"
                 class="mt-1 text-xs text-red-400">Ingresá un email válido.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Contraseña</label>
              <div class="relative">
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                  class="w-full rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-gray-500 focus:outline-none transition-colors"
                  style="background:#1f2940;border:1px solid #1f2940"
                  placeholder="••••••••"/>
                <button type="button" (click)="showPwd.set(!showPwd())"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {{ showPwd() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="remember" class="rounded w-4 h-4"/>
                <span class="text-sm text-gray-400">Recordarme</span>
              </label>
              <button type="button" (click)="forgotPassword()"
                class="text-sm font-medium transition-colors" style="color:#00FF66">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" [disabled]="loading() || form.invalid"
              class="w-full py-3 px-6 rounded-xl font-black uppercase tracking-wider text-sm transition-all disabled:opacity-40"
              style="background:#00FF66;color:#0d1117">
              {{ loading() ? 'Ingresando...' : 'INGRESAR AL TORNEO' }}
            </button>
          </form>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t" style="border-color:#1f2940"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-3 text-gray-500 uppercase tracking-wider" style="background:#0d1117">O continuá con</span>
            </div>
          </div>

          <button (click)="googleLogin()" [disabled]="loading()"
            class="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-3 transition-all hover:opacity-80"
            style="background:transparent;border:1px solid #1f2940">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p class="text-center text-sm text-gray-400 mt-8">
            ¿No tenés cuenta?
            <a routerLink="/auth/registro" class="font-semibold ml-1 transition-colors" style="color:#00FF66">
              Registrate ahora
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error   = signal('');
  showPwd = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    try {
      await this.auth.loginWithEmail(this.form.value.email!, this.form.value.password!);
    } catch (e: any) {
      this.error.set(this.mapErr(e.code));
    } finally { this.loading.set(false); }
  }

  async googleLogin(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { await this.auth.loginWithGoogle(); }
    catch { this.error.set('No se pudo iniciar sesión con Google.'); }
    finally { this.loading.set(false); }
  }

  async forgotPassword(): Promise<void> {
    const email = this.form.value.email;
    if (!email) { this.error.set('Ingresá tu email primero.'); return; }
    try {
      await this.auth.sendPasswordReset(email);
      alert(`Se envió un email a ${email} para restablecer tu contraseña.`);
    } catch { this.error.set('No se pudo enviar el email de recuperación.'); }
  }

  private mapErr(code: string): string {
    return ({
      'auth/user-not-found':     'No existe una cuenta con ese email.',
      'auth/wrong-password':     'Contraseña incorrecta.',
      'auth/invalid-email':      'El email no es válido.',
      'auth/too-many-requests':  'Demasiados intentos. Esperá unos minutos.',
      'auth/invalid-credential': 'Email o contraseña incorrectos.',
    } as Record<string, string>)[code] ?? 'Ocurrió un error. Intentá de nuevo.';
  }
}
