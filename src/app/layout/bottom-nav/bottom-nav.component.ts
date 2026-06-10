import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector:   'app-bottom-nav',
  standalone: true,
  imports:    [CommonModule, RouterModule],
  styles: [`
    .bn-link {
      color: #6b7280;
      border-radius: 1.25rem;
      position: relative;
      transition: color 0.25s ease;
    }

    /* Cápsula del ítem activo */
    .bn-link.active-bn {
      color: #E2C06A;
      background: linear-gradient(135deg, rgba(123,31,53,0.85), rgba(61,14,28,0.9));
      box-shadow:
        0 0 0 1px rgba(201,168,67,0.35),
        0 4px 16px rgba(123,31,53,0.5),
        inset 0 1px 0 rgba(201,168,67,0.2);
    }

    .bn-icon {
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease;
    }
    .bn-link.active-bn .bn-icon { transform: translateY(-1px) scale(1.15); }

    /* Imágenes: apagadas inactivas, a color + glow activas */
    .bn-img { filter: grayscale(1) opacity(0.55); }
    .bn-link.active-bn .bn-img {
      filter: grayscale(0) opacity(1) drop-shadow(0 0 8px rgba(201,168,67,0.6));
    }

    /* Punto indicador bajo el ítem activo */
    .bn-dot {
      width: 4px; height: 4px;
      border-radius: 9999px;
      background: #C9A843;
      opacity: 0;
      transform: scale(0);
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    .bn-link.active-bn .bn-dot { opacity: 1; transform: scale(1); }

    /* Label oculto cuando inactivo en pantallas chicas, siempre visible si activo */
    .bn-label {
      transition: opacity 0.25s ease;
      opacity: 0.75;
    }
    .bn-link.active-bn .bn-label { opacity: 1; font-weight: 800; }
  `],
  template: `
    <!-- Bottom nav flotante — solo mobile -->
    <nav class="md:hidden fixed left-3 right-3 z-50"
         style="bottom: calc(0.75rem + env(safe-area-inset-bottom))">
      <div class="flex items-stretch justify-around px-1.5 py-0.5 rounded-[2rem]"
           style="background:rgba(20,9,13,0.78);
                  backdrop-filter:blur(24px) saturate(1.4);
                  -webkit-backdrop-filter:blur(24px) saturate(1.4);
                  border:1px solid rgba(201,168,67,0.18);
                  box-shadow:0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)">

        <a routerLink="/" routerLinkActive="active-bn" [routerLinkActiveOptions]="{exact:true}"
           class="bn-link flex flex-col items-center gap-0.5 py-1.5 px-3 flex-1">
          <span class="bn-icon text-lg leading-none">🏠</span>
          <span class="bn-label text-[10px]">Inicio</span>
          <span class="bn-dot"></span>
        </a>

        <a routerLink="/mis-apuestas" routerLinkActive="active-bn"
           class="bn-link flex flex-col items-center gap-0.5 py-1.5 px-3 flex-1">
          <img src="assets/trionda.png" alt="Apuestas" class="bn-icon bn-img w-5 h-5 object-contain"/>
          <span class="bn-label text-[10px]">Apuestas</span>
          <span class="bn-dot"></span>
        </a>

        <a routerLink="/tabla" routerLinkActive="active-bn"
           class="bn-link flex flex-col items-center gap-0.5 py-1.5 px-3 flex-1">
          <span class="bn-icon text-lg leading-none">📊</span>
          <span class="bn-label text-[10px]">Tabla</span>
          <span class="bn-dot"></span>
        </a>

        <a routerLink="/ranking" routerLinkActive="active-bn"
           class="bn-link flex flex-col items-center gap-0.5 py-1.5 px-3 flex-1">
          <img src="assets/copa-mundial-sin-fondo.png" alt="Ranking" class="bn-icon bn-img w-5 h-5 object-contain"/>
          <span class="bn-label text-[10px]">Ranking</span>
          <span class="bn-dot"></span>
        </a>

        <a routerLink="/perfil" routerLinkActive="active-bn"
           class="bn-link flex flex-col items-center gap-0.5 py-1.5 px-3 flex-1">
          <span class="bn-icon text-lg leading-none">👤</span>
          <span class="bn-label text-[10px]">Perfil</span>
          <span class="bn-dot"></span>
        </a>

      </div>
    </nav>
  `,
})
export class BottomNavComponent {}
