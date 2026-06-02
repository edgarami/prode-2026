import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector:   'app-footer',
  standalone: true,
  imports:    [RouterModule],
  template: `
    <footer class="bg-dark border-t border-surface-light mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-primary font-black">⚽</span>
            <span class="font-bold text-white text-sm">World Cup Predictor 2026</span>
          </div>
          <p class="text-xs text-gray-500">© 2026 World Cup Predictor. Todos los derechos reservados.</p>
          <nav class="flex items-center gap-4">
            <a routerLink="/reglas"  class="text-xs text-gray-400 hover:text-white transition-colors">Reglas</a>
            <a routerLink="/ranking" class="text-xs text-gray-400 hover:text-white transition-colors">Ranking</a>
          </nav>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
