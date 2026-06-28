import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent }       from '../navbar/navbar.component';
import { FooterComponent }       from '../footer/footer.component';
import { BottomNavComponent }    from '../bottom-nav/bottom-nav.component';
import { InstallPromptComponent } from '../../shared/components/install-prompt/install-prompt.component';
import { NotificationService }   from '../../core/services/notification.service';

@Component({
  selector:   'app-shell',
  standalone: true,
  imports:    [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, BottomNavComponent, InstallPromptComponent],
  template: `
    <div class="min-h-screen flex flex-col" style="background-color:#0E0608">
      <app-navbar></app-navbar>
      <!-- pb-20 en mobile para que la bottom nav no tape el contenido -->
      <main class="flex-1 pb-24 md:pb-0"><router-outlet></router-outlet></main>
      <app-footer class="hidden md:block"></app-footer>
      <app-bottom-nav></app-bottom-nav>
      <app-install-prompt></app-install-prompt>

      <!-- Toast de notificación con la app abierta -->
      <div *ngIf="notif.foregroundMsg() as msg"
           class="fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-full max-w-sm px-4 animate-slide-up">
        <div class="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
             style="background:linear-gradient(135deg,#1E0E13,#2A1219);border:1px solid rgba(201,168,67,0.5)">
          <span class="text-2xl shrink-0">🔔</span>
          <div class="min-w-0">
            <p class="font-black text-white text-sm truncate">{{ msg.title }}</p>
            <p class="text-xs text-gray-300">{{ msg.body }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  readonly notif = inject(NotificationService);

  ngOnInit(): void {
    // Si ya dio permiso en una sesión anterior, escuchar mensajes en foreground
    if (this.notif.isSupported() && this.notif.permission() === 'granted') {
      this.notif.listenForeground();
    }
  }
}
