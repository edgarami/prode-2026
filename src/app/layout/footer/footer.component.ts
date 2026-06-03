import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector:   'app-footer',
  standalone: true,
  imports:    [RouterModule],
  template: `
    <footer style="background:#0E0608;border-top:1px solid rgba(123,31,53,0.3)" class="mt-auto relative overflow-hidden">

      <!-- Widget Sofá — esquina inferior derecha -->
      <div class="absolute bottom-0 right-0 pointer-events-none select-none hidden sm:block"
           style="width:180px;height:180px">
        <!-- Imagen tv/sofá -->
        <img src="assets/tv-img.png" alt="Sofá 2026"
             class="absolute bottom-0 right-4 w-32 h-32 object-contain"
             style="filter:drop-shadow(0 0 12px rgba(201,168,67,0.25))"/>
        <!-- Texto flotante con animación -->
        <div class="absolute bottom-24 right-3 animate-float">
          <div class="px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap"
               style="background:linear-gradient(135deg,rgba(123,31,53,0.9),rgba(61,14,28,0.95));
                      border:1px solid rgba(201,168,67,0.4);
                      color:#C9A843;
                      box-shadow:0 0 12px rgba(201,168,67,0.2)">
            📺 Rumbo al Sofá 2026
          </div>
          <!-- Flecha apuntando a la imagen -->
          <div class="flex justify-end pr-6 mt-1">
            <span style="color:#C9A843;font-size:0.65rem">↓</span>
          </div>
        </div>
      </div>

      <!-- Widget mobile — encima del footer -->
      <div class="sm:hidden flex items-center justify-center gap-3 py-4 mx-4 mb-2 rounded-2xl"
           style="background:rgba(123,31,53,0.15);border:1px solid rgba(201,168,67,0.15)">
        <img src="assets/tv-img.png" alt="Sofá 2026"
             class="w-10 h-10 object-contain"
             style="filter:drop-shadow(0 0 8px rgba(201,168,67,0.3))"/>
        <span class="text-xs font-black" style="color:#C9A843">📺 Rumbo al Sofá 2026</span>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:pb-8 sm:pr-48">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-5">

          <!-- Logo -->
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style="background:linear-gradient(135deg,#7B1F35,#3D0E1C)">
              <span class="text-base">⚽</span>
            </div>
            <div>
              <p class="font-black text-sm"
                 style="background:linear-gradient(135deg,#E2C06A,#C9A843);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                La Quiniela Vinotinto
              </p>
              <p class="text-xs" style="color:#5A1525">Predecí. Competí. Ganá.</p>
            </div>
          </div>

          <!-- Links -->
          <nav class="flex items-center gap-5 flex-wrap justify-center">
            <a routerLink="/"             class="text-xs text-gray-500 hover:text-white transition-colors">Inicio</a>
            <a routerLink="/mis-apuestas" class="text-xs text-gray-500 hover:text-white transition-colors">Mis Apuestas</a>
            <a routerLink="/ranking"      class="text-xs text-gray-500 hover:text-white transition-colors">Ranking</a>
            <a routerLink="/reglas"       class="text-xs text-gray-500 hover:text-white transition-colors">Reglas</a>
          </nav>

          <p class="text-xs" style="color:#3D0E1C">© 2026 La Quiniela Vinotinto.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
