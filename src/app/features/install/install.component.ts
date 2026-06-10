import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-install',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <!-- Header -->
      <div class="text-center mb-10">
        <img src="assets/logo.png" alt="Logo" class="w-20 h-20 rounded-2xl mx-auto mb-4 object-contain"
             style="border:2px solid rgba(201,168,67,0.3)"/>
        <h1 class="text-3xl font-black text-white">Instalá la app</h1>
        <p class="text-gray-400 mt-2 text-sm">
          Accedé directo desde tu pantalla de inicio, sin abrir el navegador.
        </p>
      </div>

      <!-- Tabs selector -->
      <div class="flex rounded-xl overflow-hidden mb-8" style="background:#1E0E13;border:1px solid #2A1219">
        <button (click)="tab='android'"
          class="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all"
          [style.background]="tab==='android' ? 'linear-gradient(135deg,#7B1F35,#3D0E1C)' : 'transparent'"
          [style.color]="tab==='android' ? '#E2C06A' : '#6b7280'">
          <span class="text-lg">🤖</span> Android
        </button>
        <button (click)="tab='ios'"
          class="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all"
          [style.background]="tab==='ios' ? 'linear-gradient(135deg,#7B1F35,#3D0E1C)' : 'transparent'"
          [style.color]="tab==='ios' ? '#E2C06A' : '#6b7280'">
          <span class="text-lg">🍎</span> iPhone / iPad
        </button>
      </div>

      <!-- Android -->
      <div *ngIf="tab==='android'">
        <div class="rounded-2xl overflow-hidden mb-4" style="background:#1E0E13;border:1px solid #2A1219">

          <!-- Tip rápido -->
          <div class="px-5 py-4" style="background:rgba(201,168,67,0.07);border-bottom:1px solid #2A1219">
            <p class="text-sm font-semibold" style="color:#C9A843">
              💡 En Android el banner aparece automáticamente
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Después de visitar la app un par de veces, Chrome muestra una notificación para instalarla.
              Si no aparece, seguí los pasos manuales:
            </p>
          </div>

          <!-- Pasos -->
          <div class="divide-y" style="border-color:#2A1219">
            <div *ngFor="let step of androidSteps; let i = index" class="flex items-start gap-4 px-5 py-4">
              <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-sm"
                   style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
                {{ i + 1 }}
              </div>
              <div class="flex-1">
                <p class="font-semibold text-white text-sm">{{ step.title }}</p>
                <p class="text-gray-400 text-xs mt-1" [innerHTML]="step.desc"></p>
              </div>
              <span class="text-2xl shrink-0">{{ step.icon }}</span>
            </div>
          </div>
        </div>

        <!-- Compatibilidad -->
        <div class="rounded-2xl px-5 py-4 flex items-start gap-3" style="background:#1E0E13;border:1px solid #2A1219">
          <span class="text-xl shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-white">Compatible con Chrome y Edge</p>
            <p class="text-xs text-gray-400 mt-0.5">Funciona en Android 5+ con Chrome 67 o superior.</p>
          </div>
        </div>
      </div>

      <!-- iOS -->
      <div *ngIf="tab==='ios'">
        <div class="rounded-2xl overflow-hidden mb-4" style="background:#1E0E13;border:1px solid #2A1219">

          <!-- Aviso Safari -->
          <div class="px-5 py-4" style="background:rgba(201,168,67,0.07);border-bottom:1px solid #2A1219">
            <p class="text-sm font-semibold" style="color:#C9A843">
              ⚠️ Debe hacerse desde Safari
            </p>
            <p class="text-xs text-gray-400 mt-1">
              En iPhone e iPad, la instalación solo funciona desde el navegador <strong class="text-white">Safari</strong>.
              No funciona desde Chrome ni otros navegadores de iOS.
            </p>
          </div>

          <!-- Pasos -->
          <div class="divide-y" style="border-color:#2A1219">
            <div *ngFor="let step of iosSteps; let i = index" class="flex items-start gap-4 px-5 py-4">
              <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-sm"
                   style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
                {{ i + 1 }}
              </div>
              <div class="flex-1">
                <p class="font-semibold text-white text-sm">{{ step.title }}</p>
                <p class="text-gray-400 text-xs mt-1" [innerHTML]="step.desc"></p>
              </div>
              <span class="text-2xl shrink-0">{{ step.icon }}</span>
            </div>
          </div>
        </div>

        <!-- Compatibilidad -->
        <div class="rounded-2xl px-5 py-4 flex items-start gap-3" style="background:#1E0E13;border:1px solid #2A1219">
          <span class="text-xl shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-white">Compatible con iOS 16.4+</p>
            <p class="text-xs text-gray-400 mt-0.5">Requiere Safari en iPhone o iPad con iOS 16.4 o superior para soporte completo de PWA.</p>
          </div>
        </div>
      </div>

      <!-- Ventajas de instalar -->
      <div class="mt-8 rounded-2xl p-5" style="background:#1E0E13;border:1px solid #2A1219">
        <h3 class="font-black text-white text-sm mb-4">🚀 ¿Por qué instalarla?</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div *ngFor="let b of benefits" class="flex items-start gap-3">
            <span class="text-lg shrink-0">{{ b.icon }}</span>
            <div>
              <p class="text-white text-sm font-semibold">{{ b.title }}</p>
              <p class="text-gray-500 text-xs mt-0.5">{{ b.desc }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class InstallComponent {
  tab = 'android';

  androidSteps = [
    {
      icon: '🌐',
      title: 'Abrí la app en Chrome',
      desc: 'Entrá a <strong class="text-white">world-cup-predictor-c431d.web.app</strong> desde Chrome en tu Android.',
    },
    {
      icon: '⋮',
      title: 'Tocá el menú de Chrome',
      desc: 'Presioná el ícono de tres puntos <strong class="text-white">⋮</strong> en la esquina superior derecha.',
    },
    {
      icon: '📲',
      title: 'Seleccioná "Añadir a pantalla de inicio"',
      desc: 'Buscá la opción <strong class="text-white">"Añadir a pantalla de inicio"</strong> o <strong class="text-white">"Instalar app"</strong> en el menú.',
    },
    {
      icon: '✅',
      title: '¡Listo! Ya la tenés instalada',
      desc: 'Aparece un ícono en tu pantalla de inicio. Abrila como cualquier app nativa.',
    },
  ];

  iosSteps = [
    {
      icon: '🧭',
      title: 'Abrí Safari',
      desc: 'Asegurate de estar usando <strong class="text-white">Safari</strong> (el navegador azul de Apple, no Chrome ni otro).',
    },
    {
      icon: '🌐',
      title: 'Entrá a la app',
      desc: 'Escribí <strong class="text-white">world-cup-predictor-c431d.web.app</strong> en la barra de dirección.',
    },
    {
      icon: '⬆️',
      title: 'Tocá el botón Compartir',
      desc: 'En la barra inferior de Safari, tocá el ícono <strong class="text-white">⬆️</strong> (cuadrado con flecha hacia arriba).',
    },
    {
      icon: '➕',
      title: 'Elegí "Añadir a pantalla de inicio"',
      desc: 'Deslizá el menú y tocá <strong class="text-white">"Añadir a pantalla de inicio"</strong>. Confirmá el nombre y tocá <strong class="text-white">Añadir</strong>.',
    },
    {
      icon: '✅',
      title: '¡Listo! Ya la tenés instalada',
      desc: 'El ícono aparece en tu pantalla de inicio. Se abre sin barras de navegador, como una app real.',
    },
  ];

  benefits = [
    { icon: '⚡', title: 'Acceso instantáneo',   desc: 'Un toque y ya estás adentro, sin abrir el navegador.' },
    { icon: '📴', title: 'Funciona offline',      desc: 'Podés ver tus predicciones sin conexión.' },
    { icon: '🖥️', title: 'Pantalla completa',     desc: 'Sin barras del navegador, como una app nativa.' },
    { icon: '🔔', title: 'Notificaciones',        desc: 'Recibí alertas antes de que cierren las apuestas.' },
  ];
}
