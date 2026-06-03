import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector:   'app-root',
  standalone: true,
  imports:    [RouterOutlet, CommonModule],
  template: `
    <!-- Pantalla de carga mientras Firebase inicializa -->
    <div *ngIf="auth.loading()"
      class="min-h-screen flex flex-col items-center justify-center"
      style="background-color:#0E0608">
      <div class="flex items-center gap-3 mb-6">
        <span class="text-4xl">⚽</span>
        <span class="text-2xl font-black" style="color:#C9A843">La Quiniela Vinotinto</span>
      </div>
      <div class="w-10 h-10 rounded-full border-2 animate-spin"
           style="border-color:#2A1219;border-top-color:#C9A843"></div>
      <p class="text-gray-400 text-sm mt-4">Cargando...</p>
    </div>

    <!-- App principal -->
    <router-outlet *ngIf="!auth.loading()"></router-outlet>
  `,
})
export class App {
  readonly auth = inject(AuthService);
}
