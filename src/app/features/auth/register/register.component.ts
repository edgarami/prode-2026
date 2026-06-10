import { Component, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService }   from '../../../core/services/auth.service';
import { LeagueService } from '../../../core/services/league.service';
import { League } from '../../../core/models';

function passwordsMatch(ctrl: AbstractControl): ValidationErrors | null {
  return ctrl.get('password')?.value === ctrl.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  selector:        'app-register',
  standalone:      true,
  imports:         [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row" style="background:#0E0608">

      <!-- ═══ BANNER (izquierda desktop / top mobile) ═══ -->
      <div class="relative lg:w-1/2 lg:min-h-screen overflow-hidden" style="min-height:200px">

        <img src="assets/login-banner-desktop.png" alt="World Cup 2026"
             class="hidden lg:block absolute inset-0 w-full h-full object-cover object-center"/>
        <img src="assets/login-banner-mobile.png" alt="World Cup 2026"
             class="lg:hidden absolute inset-0 w-full h-full object-cover object-center"/>

        <!-- Overlay -->
        <div class="absolute inset-0"
             style="background:linear-gradient(to bottom, rgba(14,6,8,0.2) 0%, rgba(14,6,8,0.5) 70%, rgba(14,6,8,0.95) 100%)"></div>
        <div class="hidden lg:block absolute inset-0"
             style="background:linear-gradient(to right, transparent 60%, #0E0608 100%)"></div>

        <div class="relative z-10 h-full flex flex-col justify-end p-6 lg:p-10 pb-8 lg:pb-12">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                 style="background:linear-gradient(135deg,#7B1F35,#3D0E1C)">
              <img src="assets/trionda.png" alt="Trionda" class="w-full h-full object-contain p-0.5"/>
            </div>
            <span class="font-black text-base"
                  style="background:linear-gradient(135deg,#E2C06A,#C9A843);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              La Quiniela Vinotinto
            </span>
          </div>
          <h2 class="text-2xl lg:text-3xl font-black text-white leading-tight mb-2">
            Tu momento ha llegado.<br/>
            <span style="color:#C9A843">El de Venezuela todavía no.</span>
          </h2>
          <p class="text-gray-400 text-sm">Predecí los 104 partidos del Mundial 2026.</p>
        </div>
      </div>

      <!-- ═══ FORMULARIO ═══ -->
      <div class="flex-1 flex items-center justify-center px-6 py-10 lg:py-8">
        <div class="w-full max-w-sm animate-fade-in">

          <div class="mb-6">
            <h1 class="text-2xl font-black text-white">Crear cuenta</h1>
            <p class="text-gray-400 text-sm mt-1">Unite y predecí desde el primer partido.</p>
          </div>

          <div *ngIf="error()" class="mb-4 p-3 rounded-xl text-sm text-red-400"
               style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">
            {{ error() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Nombre o apodo</label>
              <input type="text" formControlName="displayName"
                class="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
                style="background:#1E0E13;border:1px solid #2A1219"
                placeholder="Ej: Messi Fan 10"
                onfocus="this.style.borderColor='#C9A843'" onblur="this.style.borderColor='#2A1219'"/>
              <p *ngIf="form.get('displayName')?.invalid && form.get('displayName')?.touched"
                 class="mt-1 text-xs text-red-400">Nombre entre 2 y 30 caracteres.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <input type="email" formControlName="email"
                class="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
                style="background:#1E0E13;border:1px solid #2A1219"
                placeholder="nombre@ejemplo.com"
                onfocus="this.style.borderColor='#C9A843'" onblur="this.style.borderColor='#2A1219'"/>
              <p *ngIf="form.get('email')?.invalid && form.get('email')?.touched"
                 class="mt-1 text-xs text-red-400">Email inválido.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Contraseña</label>
              <div class="relative">
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                  class="w-full rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
                  style="background:#1E0E13;border:1px solid #2A1219"
                  placeholder="Mínimo 6 caracteres"
                  onfocus="this.style.borderColor='#C9A843'" onblur="this.style.borderColor='#2A1219'"/>
                <button type="button" (click)="showPwd.set(!showPwd())"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-sm">
                  {{ showPwd() ? '🙈' : '👁️' }}
                </button>
              </div>
              <p *ngIf="form.get('password')?.invalid && form.get('password')?.touched"
                 class="mt-1 text-xs text-red-400">Mínimo 6 caracteres.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Confirmá tu contraseña</label>
              <input [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword"
                class="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
                style="background:#1E0E13;border:1px solid #2A1219"
                placeholder="Repetí tu contraseña"
                onfocus="this.style.borderColor='#C9A843'" onblur="this.style.borderColor='#2A1219'"/>
              <p *ngIf="form.errors?.['mismatch'] && form.get('confirmPassword')?.touched"
                 class="mt-1 text-xs text-red-400">Las contraseñas no coinciden.</p>
            </div>

            <!-- Código de liga (opcional) -->
            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">
                Código de liga
                <span class="font-normal text-gray-500 ml-1">(opcional)</span>
              </label>
              <div class="relative">
                <input type="text" formControlName="leagueCode"
                  class="w-full rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-gray-500 focus:outline-none transition-all uppercase tracking-widest font-bold"
                  style="background:#1E0E13;border:1px solid #2A1219"
                  placeholder="Ej: MANO2026"
                  (input)="onCodeInput()"
                  onfocus="this.style.borderColor='#C9A843'" onblur="this.style.borderColor='#2A1219'"/>
                <!-- Estado de validación del código -->
                <div class="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <span *ngIf="validatingCode()" class="text-gray-400 text-xs">⏳</span>
                  <span *ngIf="!validatingCode() && resolvedLeague()" class="text-green-400">✓</span>
                  <span *ngIf="!validatingCode() && codeInvalid()" class="text-red-400">✗</span>
                </div>
              </div>
              <!-- Liga resuelta -->
              <div *ngIf="resolvedLeague()" class="mt-2 px-3 py-2 rounded-lg flex items-center gap-2"
                   style="background:rgba(201,168,67,0.1);border:1px solid rgba(201,168,67,0.2)">
                <span class="text-sm">🏆</span>
                <span class="text-xs font-semibold" style="color:#C9A843">{{ resolvedLeague()!.name }}</span>
              </div>
              <p *ngIf="codeInvalid()" class="mt-1 text-xs text-red-400">
                Código inválido. Pedíle el código al administrador de tu liga.
              </p>
              <p *ngIf="!resolvedLeague() && !codeInvalid() && !form.get('leagueCode')?.value" class="mt-1 text-xs text-gray-500">
                Si no tenés código, te unimos a "Mano tengo fe" por defecto.
              </p>
            </div>

            <label class="flex items-start gap-3 cursor-pointer pt-1">
              <input type="checkbox" formControlName="terms"
                class="w-4 h-4 rounded mt-0.5 shrink-0 cursor-pointer"
                style="accent-color:#C9A843"/>
              <span class="text-sm text-gray-400">
                Acepto las <a routerLink="/reglas" class="font-semibold hover:opacity-80" style="color:#C9A843">reglas del juego</a> y el funcionamiento de la quiniela.
              </span>
            </label>
            <p *ngIf="form.get('terms')?.invalid && form.get('terms')?.touched"
               class="text-xs text-red-400">Debés aceptar las reglas.</p>

            <button type="submit" [disabled]="loading() || form.invalid || validatingCode() || codeInvalid()"
              class="w-full py-3.5 px-6 rounded-xl font-black uppercase tracking-wider text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed mt-1"
              style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608;box-shadow:0 0 20px rgba(201,168,67,0.25)">
              {{ loading() ? 'Creando cuenta...' : 'CREAR MI CUENTA' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full" style="border-top:1px solid #2A1219"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 text-xs text-gray-500 uppercase tracking-widest" style="background:#0E0608">
                O registrate con
              </span>
            </div>
          </div>

          <button (click)="googleRegister()" [disabled]="loading()"
            class="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-3 transition-all hover:opacity-80 disabled:opacity-40"
            style="border:1px solid #2A1219">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p class="text-center text-sm text-gray-400 mt-6">
            ¿Ya tenés cuenta?
            <a routerLink="/auth/login" class="font-bold ml-1 hover:opacity-80 transition-opacity" style="color:#C9A843">
              Iniciá sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb            = inject(FormBuilder);
  private auth          = inject(AuthService);
  private leagueService = inject(LeagueService);
  private cdr           = inject(ChangeDetectorRef);

  loading        = signal(false);
  error          = signal('');
  showPwd        = signal(false);
  validatingCode = signal(false);
  resolvedLeague = signal<League | null>(null);
  codeInvalid    = signal(false);

  private codeTimer: any = null;

  form = this.fb.group({
    displayName:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    leagueCode:      [''],
    terms:           [false, Validators.requiredTrue],
  }, { validators: passwordsMatch });

  onCodeInput(): void {
    const code = (this.form.get('leagueCode')?.value ?? '').trim();
    this.resolvedLeague.set(null);
    this.codeInvalid.set(false);
    clearTimeout(this.codeTimer);

    if (!code) return;

    this.validatingCode.set(true);
    this.cdr.markForCheck();

    this.codeTimer = setTimeout(async () => {
      try {
        const league = await this.leagueService.getLeagueByCode(code);
        if (league) {
          this.resolvedLeague.set(league);
          this.codeInvalid.set(false);
        } else {
          this.codeInvalid.set(true);
        }
      } catch {
        this.codeInvalid.set(true);
      } finally {
        this.validatingCode.set(false);
        this.cdr.markForCheck();
      }
    }, 600);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.codeInvalid()) return;

    this.loading.set(true); this.error.set('');
    try {
      // Solo se une a la liga si ingresó un código válido
      const resolved   = this.resolvedLeague();
      const leagueIds  = resolved ? [resolved.id] : [];

      await this.auth.registerWithEmail(
        this.form.value.email!,
        this.form.value.password!,
        this.form.value.displayName!,
        leagueIds,
      );

      // Actualizar memberCount si se unió a alguna liga
      const uid = this.auth.currentUser()?.uid;
      if (uid && resolved) {
        await this.leagueService.joinLeague(uid, resolved.id);
      }
    } catch (e: any) {
      this.error.set(this.mapErr(e.code));
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  async googleRegister(): Promise<void> {
    this.loading.set(true);
    try { await this.auth.loginWithGoogle(); }
    catch { this.error.set('No se pudo registrar con Google.'); }
    finally { this.loading.set(false); this.cdr.markForCheck(); }
  }

  private mapErr(code: string): string {
    return ({
      'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
      'auth/weak-password':        'La contraseña es muy débil.',
      'auth/invalid-email':        'El email no es válido.',
    } as Record<string, string>)[code] ?? 'Ocurrió un error. Intentá de nuevo.';
  }
}
