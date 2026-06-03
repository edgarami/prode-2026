import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector:   'app-navbar',
  standalone: true,
  imports:    [CommonModule, RouterModule],
  template: `
    <nav class="sticky top-0 z-50 backdrop-blur-md"
         style="background:rgba(14,6,8,0.95);border-bottom:1px solid rgba(123,31,53,0.4)">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2.5 group">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                 style="background:linear-gradient(135deg,#7B1F35,#3D0E1C)">
              <span class="text-base">⚽</span>
            </div>
            <span class="text-base font-black text-gold-gradient hidden sm:block"
                  style="background:linear-gradient(135deg,#E2C06A,#C9A843);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              La Quiniela Vinotinto
            </span>
            <span class="text-base font-black sm:hidden"
                  style="background:linear-gradient(135deg,#E2C06A,#C9A843);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              Vinotinto
            </span>
          </a>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/"            routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:true}" class="nav-link">Inicio</a>
            <a routerLink="/mis-apuestas" routerLinkActive="active-link" class="nav-link">Mis Apuestas</a>
            <a routerLink="/tabla"        routerLinkActive="active-link" class="nav-link">Tabla</a>
            <a routerLink="/ranking"      routerLinkActive="active-link" class="nav-link">Ranking</a>
            <a *ngIf="isAdmin()" routerLink="/admin" routerLinkActive="active-link"
               class="nav-link" style="color:#C9A843 !important">⚙ Admin</a>
          </div>

          <!-- User desktop -->
          <div class="hidden md:flex items-center gap-3">
            <div class="relative">
              <button (click)="dropdownOpen.set(!dropdownOpen())"
                class="flex items-center gap-2.5 py-1.5 px-3 rounded-xl transition-all hover:opacity-80"
                style="background:#1E0E13;border:1px solid #2A1219">
                <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                     style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#C9A843">
                  {{ userProfile()?.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
                </div>
                <span class="text-sm font-semibold text-white max-w-24 truncate">
                  {{ userProfile()?.displayName ?? 'Usuario' }}
                </span>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <div *ngIf="dropdownOpen()"
                class="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl py-2 z-50"
                style="background:#1E0E13;border:1px solid #2A1219">
                <div class="px-4 py-3 mb-1" style="border-bottom:1px solid #2A1219">
                  <p class="font-bold text-white text-sm">{{ userProfile()?.displayName }}</p>
                  <p class="text-xs mt-0.5" style="color:#C9A843">{{ userProfile()?.totalPoints ?? 0 }} puntos</p>
                </div>
                <a routerLink="/perfil" (click)="dropdownOpen.set(false)"
                   class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">
                  👤 Mi Perfil
                </a>
                <a routerLink="/reglas" (click)="dropdownOpen.set(false)"
                   class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">
                  📋 Reglas
                </a>
                <div style="border-top:1px solid #2A1219" class="mt-1 pt-1">
                  <button (click)="logout()"
                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 text-left transition-colors">
                    🚪 Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile burger -->
          <button class="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            (click)="mobileOpen.set(!mobileOpen())">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path *ngIf="!mobileOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"/>
              <path *ngIf="mobileOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Mobile menu -->
        <div *ngIf="mobileOpen()" class="md:hidden pb-4 pt-3 animate-fade-in"
             style="border-top:1px solid #2A1219">
          <div class="flex items-center gap-3 px-2 py-3 mb-3 rounded-xl" style="background:#1E0E13">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                 style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#C9A843">
              {{ userProfile()?.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
            </div>
            <div>
              <p class="font-bold text-white text-sm">{{ userProfile()?.displayName }}</p>
              <p class="text-xs" style="color:#C9A843">{{ userProfile()?.totalPoints ?? 0 }} pts</p>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <a routerLink="/"             (click)="mobileOpen.set(false)" class="mobile-link">🏠 Inicio</a>
            <a routerLink="/mis-apuestas" (click)="mobileOpen.set(false)" class="mobile-link">⚽ Mis Apuestas</a>
            <a routerLink="/tabla"        (click)="mobileOpen.set(false)" class="mobile-link">📊 Tabla de Posiciones</a>
            <a routerLink="/ranking"      (click)="mobileOpen.set(false)" class="mobile-link">🏆 Ranking</a>
            <a routerLink="/perfil"       (click)="mobileOpen.set(false)" class="mobile-link">👤 Mi Perfil</a>
            <a routerLink="/reglas"       (click)="mobileOpen.set(false)" class="mobile-link">📋 Reglas</a>
            <a *ngIf="isAdmin()" routerLink="/admin" (click)="mobileOpen.set(false)"
               class="mobile-link" style="color:#C9A843">⚙️ Admin</a>
            <button (click)="logout()"
              class="mobile-link text-left text-red-400 hover:text-red-300">
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link {
      padding: 8px 14px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #9ca3af;
      border-radius: 10px;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    .nav-link:hover { color: #fff; background: rgba(123,31,53,0.2); }
    .active-link { color: #C9A843 !important; background: rgba(201,168,67,0.1) !important; }
    .mobile-link {
      display: block;
      padding: 12px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #d1d5db;
      border-radius: 12px;
      transition: all 0.2s;
      text-decoration: none;
      background: transparent;
      border: none;
      cursor: pointer;
      width: 100%;
    }
    .mobile-link:hover { color: #fff; background: rgba(123,31,53,0.2); }
  `],
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);

  userProfile  = this.authService.userProfile;
  isAdmin      = this.authService.isAdmin;
  mobileOpen   = signal(false);
  dropdownOpen = signal(false);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => { this.mobileOpen.set(false); this.dropdownOpen.set(false); });
  }

  async logout(): Promise<void> {
    this.mobileOpen.set(false);
    this.dropdownOpen.set(false);
    await this.authService.logout();
  }
}
