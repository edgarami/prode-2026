import {
  Component, signal, HostListener, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-install-prompt',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Banner Android/Desktop -->
    <div *ngIf="showAndroid()"
         class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div class="rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
           style="background:linear-gradient(135deg,#1E0E13,#2A1219);border:1px solid rgba(201,168,67,0.4)">
        <img src="assets/logo.png" class="w-12 h-12 rounded-xl shrink-0 object-contain" alt="Logo"/>
        <div class="flex-1 min-w-0">
          <p class="font-black text-white text-sm">Instalá la app</p>
          <p class="text-xs text-gray-400 mt-0.5">Accedé directo desde tu pantalla de inicio.</p>
        </div>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button (click)="install()"
            class="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:opacity-90"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            Instalar
          </button>
          <button (click)="dismissAndroid()"
            class="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors text-center">
            Ahora no
          </button>
        </div>
      </div>
    </div>

    <!-- Guía iOS -->
    <div *ngIf="showIos()"
         class="fixed inset-0 z-50 flex items-end justify-center p-4"
         style="background:rgba(0,0,0,0.7)" (click)="dismissIos()">
      <div class="w-full max-w-sm rounded-2xl p-5 animate-slide-up"
           style="background:#1E0E13;border:1px solid rgba(201,168,67,0.3)"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <img src="assets/logo.png" class="w-10 h-10 rounded-xl object-contain" alt="Logo"/>
            <div>
              <p class="font-black text-white text-sm">Instalar en iPhone</p>
              <p class="text-xs text-gray-400">Solo 2 pasos</p>
            </div>
          </div>
          <button (click)="dismissIos()" class="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div class="space-y-3">
          <div class="flex items-start gap-3 p-3 rounded-xl" style="background:#150A0D">
            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                 style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">1</div>
            <div>
              <p class="text-white text-sm font-semibold">Tocá el botón Compartir</p>
              <p class="text-gray-400 text-xs mt-0.5">El ícono <span class="text-white">⬆️</span> en la barra inferior de Safari.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-xl" style="background:#150A0D">
            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                 style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">2</div>
            <div>
              <p class="text-white text-sm font-semibold">Seleccioná "Añadir a inicio"</p>
              <p class="text-gray-400 text-xs mt-0.5">Buscá la opción <span class="text-white">"Añadir a pantalla de inicio"</span> en el menú.</p>
            </div>
          </div>
        </div>

        <button (click)="dismissIos()"
          class="w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
          Entendido
        </button>
      </div>
    </div>
  `,
})
export class InstallPromptComponent implements OnInit {
  private cdr         = inject(ChangeDetectorRef);
  showAndroid         = signal(false);
  showIos             = signal(false);
  private deferredPrompt: any = null;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    this.deferredPrompt = event;
    if (!localStorage.getItem('pwa-dismissed')) {
      setTimeout(() => { this.showAndroid.set(true); this.cdr.markForCheck(); }, 4000);
    }
  }

  ngOnInit(): void {
    // Ya instalada como PWA — no mostrar nada
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detectar iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !localStorage.getItem('pwa-dismissed-ios')) {
      setTimeout(() => { this.showIos.set(true); this.cdr.markForCheck(); }, 5000);
    }
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.showAndroid.set(false);
    if (outcome === 'accepted') localStorage.setItem('pwa-dismissed', 'true');
    this.deferredPrompt = null;
    this.cdr.markForCheck();
  }

  dismissAndroid(): void {
    this.showAndroid.set(false);
    localStorage.setItem('pwa-dismissed', 'true');
    this.cdr.markForCheck();
  }

  dismissIos(): void {
    this.showIos.set(false);
    localStorage.setItem('pwa-dismissed-ios', 'true');
    this.cdr.markForCheck();
  }
}
