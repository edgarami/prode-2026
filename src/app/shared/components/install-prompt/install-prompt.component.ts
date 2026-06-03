import { Component, signal, HostListener, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-install-prompt',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="showBanner()"
         class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div class="rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
           style="background:linear-gradient(135deg,#1E0E13,#2A1219);border:1px solid rgba(201,168,67,0.4)">

        <img src="assets/logo.png" class="w-12 h-12 rounded-xl shrink-0 object-contain" alt="Logo"/>

        <div class="flex-1 min-w-0">
          <p class="font-black text-white text-sm">Instalá la app</p>
          <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Accedé más rápido desde tu pantalla de inicio.
          </p>
        </div>

        <div class="flex flex-col gap-1.5 shrink-0">
          <button (click)="install()"
            class="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:opacity-90"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            Instalar
          </button>
          <button (click)="dismiss()"
            class="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors text-center">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InstallPromptComponent implements OnInit {
  private cdr        = inject(ChangeDetectorRef);
  showBanner         = signal(false);
  private deferredPrompt: any = null;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    this.deferredPrompt = event;
    // Solo mostrar si no fue descartado antes
    if (!localStorage.getItem('pwa-dismissed')) {
      setTimeout(() => {
        this.showBanner.set(true);
        this.cdr.markForCheck();
      }, 3000); // Mostrar 3 segundos después de cargar
    }
  }

  ngOnInit(): void {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.showBanner.set(false);
    }
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.showBanner.set(false);
      localStorage.setItem('pwa-dismissed', 'true');
    }
    this.deferredPrompt = null;
    this.cdr.markForCheck();
  }

  dismiss(): void {
    this.showBanner.set(false);
    localStorage.setItem('pwa-dismissed', 'true');
    this.cdr.markForCheck();
  }
}
