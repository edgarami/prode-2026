import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector:   'app-navbar',
  standalone: true,
  imports:    [CommonModule, RouterModule],
  template: `
    <nav style="background:rgba(13,17,23,0.97);border-bottom:1px solid #1f2940"
         class="sticky top-0 z-50 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2">
            <span class="text-xl">⚽</span>
            <span class="text-lg font-black" style="color:#00FF66">World Cup Predictor</span>
          </a>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:true}"
               class="nav-link">Inicio</a>
            <a routerLink="/mis-apuestas" routerLinkActive="active-link" class="nav-link">Mis Apuestas</a>
            <a routerLink="/ranking"      routerLinkActive="active-link" class="nav-link">Ranking</a>
            <a *ngIf="isAdmin()" routerLink="/admin" routerLinkActive="active-link"
               class="nav-link" style="color:#f59e0b">Admin</a>
          </div>

          <!-- User -->
          <div class="hidden md:flex items-center gap-2">
            <div class="relative">
              <button (click)="dropdownOpen.set(!dropdownOpen())"
                class="flex items-center gap-2 p-1 rounded-full hover:opacity-80 transition-opacity">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                     style="background:#1f2940;border:1px solid #1f2940;color:#00FF66">
                  {{ userProfile()?.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
                </div>
              </button>
              <div *ngIf="dropdownOpen()"
                class="absolute right-0 mt-2 w-52 rounded-2xl shadow-xl py-1 z-50"
                style="background:#1a2130;border:1px solid #1f2940">
                <div class="px-4 py-2 border-b" style="border-color:#1f2940">
                  <p class="font-semibold text-white text-sm">{{ userProfile()?.displayName }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ userProfile()?.totalPoints ?? 0 }} pts</p>
                </div>
                <a routerLink="/perfil" (click)="dropdownOpen.set(false)"
                   class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-opacity-50 transition-colors"
                   style="hover:background:#1f2940">👤 Mi Perfil</a>
                <button (click)="logout()"
                  class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:opacity-80 transition-opacity text-left">
                  🚪 Cerrar sesión
                </button>
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
        <div *ngIf="mobileOpen()" class="md:hidden pb-4 border-t mt-2 pt-4" style="border-color:#1f2940">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3 px-2 py-3 mb-2">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                   style="background:#1f2940;color:#00FF66">
                {{ userProfile()?.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
              </div>
              <div>
                <p class="font-semibold text-white text-sm">{{ userProfile()?.displayName }}</p>
                <p class="text-xs text-gray-400">{{ userProfile()?.totalPoints ?? 0 }} pts</p>
              </div>
            </div>
            <a routerLink="/" (click)="mobileOpen.set(false)"
               class="px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white rounded-xl transition-colors">
              🏠 Inicio
            </a>
            <a routerLink="/mis-apuestas" (click)="mobileOpen.set(false)"
               class="px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white rounded-xl transition-colors">
              ⚽ Mis Apuestas
            </a>
            <a routerLink="/ranking" (click)="mobileOpen.set(false)"
               class="px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white rounded-xl transition-colors">
              🏆 Ranking
            </a>
            <a routerLink="/perfil" (click)="mobileOpen.set(false)"
               class="px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white rounded-xl transition-colors">
              👤 Mi Perfil
            </a>
            <a *ngIf="isAdmin()" routerLink="/admin" (click)="mobileOpen.set(false)"
               class="px-4 py-3 text-sm font-semibold rounded-xl transition-colors" style="color:#f59e0b">
              ⚙️ Admin
            </a>
            <button (click)="logout()"
              class="px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 rounded-xl text-left transition-colors">
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link {
      padding: 8px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #9ca3af;
      border-radius: 8px;
      transition: color 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    .nav-link:hover { color: #fff; }
    .active-link { color: #00FF66 !important; }
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
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileOpen.set(false);
      this.dropdownOpen.set(false);
    });
  }

  async logout(): Promise<void> {
    this.mobileOpen.set(false);
    this.dropdownOpen.set(false);
    await this.authService.logout();
  }
}
