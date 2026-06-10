import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector:        'app-rules',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <!-- Header -->
      <div class="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center"
           style="background:linear-gradient(135deg,#1E0E13 0%,#0E0608 70%,#0a1a0a 100%);border:1px solid #2A1219">
        <!-- Copa flotante izquierda -->
        <img src="assets/copa-mundial-sin-fondo.png" alt=""
             class="absolute left-4 bottom-0 w-28 sm:w-36 opacity-20 pointer-events-none select-none"
             aria-hidden="true"
             style="filter:drop-shadow(0 0 16px rgba(201,168,67,0.4))"/>
        <!-- Copa flotante derecha espejada -->
        <img src="assets/copa-mundial-sin-fondo.png" alt=""
             class="absolute right-4 bottom-0 w-28 sm:w-36 opacity-20 pointer-events-none select-none"
             aria-hidden="true"
             style="filter:drop-shadow(0 0 16px rgba(201,168,67,0.4));transform:scaleX(-1)"/>
        <div class="relative z-10">
          <img src="assets/logo-copa-del-mundo.jpg" alt="FIFA World Cup 2026"
               class="w-16 h-16 object-contain rounded-2xl mx-auto mb-4"
               style="border:1px solid rgba(201,168,67,0.3)"/>
          <h1 class="text-3xl sm:text-4xl font-black text-white mb-3">Reglas del Juego</h1>
          <p class="text-gray-400 text-lg">Domina el sistema de puntuación y escala posiciones en el ranking global.</p>
        </div>
      </div>

      <!-- Sistema de puntos -->
      <section>
        <h2 class="text-xl font-black text-white mb-4 flex items-center gap-2">
          <span class="text-2xl">🏆</span> Sistema de Puntuación
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div class="rounded-2xl p-6" style="background:#1E0E13;border:1px solid rgba(201,168,67,0.3)">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-4"
                 style="background:rgba(201,168,67,0.15);color:#C9A843">+15</div>
            <h3 class="text-lg font-black text-white mb-2">Marcador Exacto</h3>
            <p class="text-gray-400 text-sm mb-4">
              Adiviná el resultado exacto del encuentro al finalizar el tiempo reglamentario.
              <br/><br/>
              <span class="text-gray-300 font-medium">Ej: predecís 2-1 y el resultado es 2-1.</span>
            </p>
            <span class="inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style="background:rgba(201,168,67,0.1);color:#C9A843;border:1px solid rgba(201,168,67,0.2)">
              Máxima recompensa
            </span>
          </div>

          <div class="rounded-2xl p-6" style="background:#1E0E13;border:1px solid rgba(245,158,11,0.3)">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-4"
                 style="background:rgba(245,158,11,0.15);color:#f59e0b">+10</div>
            <h3 class="text-lg font-black text-white mb-2">Ganador y Diferencia</h3>
            <p class="text-gray-400 text-sm mb-4">
              Adiviná quién gana y por cuántos goles de diferencia, aunque el marcador exacto sea distinto.
              <br/><br/>
              <span class="text-gray-300 font-medium">Ej: predecís 2-0 y el resultado es 3-1 (ambos +1 de diferencia, gana local).</span>
            </p>
            <span class="inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style="background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.2)">
              Estratega experto
            </span>
          </div>

          <div class="rounded-2xl p-6" style="background:#1E0E13;border:1px solid rgba(96,165,250,0.3)">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-4"
                 style="background:rgba(96,165,250,0.15);color:#60a5fa">+5</div>
            <h3 class="text-lg font-black text-white mb-2">Ganador o Empate</h3>
            <p class="text-gray-400 text-sm mb-4">
              Adiviná simplemente el resultado final: gana el local, empate o gana el visitante, sin importar el marcador exacto.
              <br/><br/>
              <span class="text-gray-300 font-medium">Ej: predecís que gana el local y gana 1-0.</span>
            </p>
            <span class="inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style="background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.2)">
              Tendencia
            </span>
          </div>
        </div>
      </section>

      <!-- Plazos y Reglas -->
      <section>
        <h2 class="text-xl font-black text-white mb-4 flex items-center gap-2">
          <span class="text-2xl">⏱</span> Plazos y Reglas
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div class="rounded-2xl p-6" style="background:#1E0E13;border:1px solid rgba(201,168,67,0.3)">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">🔒</span>
              <h3 class="text-lg font-black text-white">Cierre de Apuestas</h3>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed">
              Todas las predicciones deben enviarse o modificarse al menos
              <span class="font-bold text-amber-400">30 minutos antes</span> del pitazo inicial.
              Una vez cerrado el plazo, no se admiten cambios.
            </p>
            <div class="mt-4 flex items-center gap-2 p-3 rounded-xl text-xs text-amber-300"
                 style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2)">
              ⚠️ El sistema bloquea automáticamente los cambios al cerrar el plazo.
            </div>
          </div>

          <div class="rounded-2xl p-6" style="background:#1E0E13;border:1px solid #2A1219">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">📌</span>
              <h3 class="text-lg font-black text-white">Reglas Generales</h3>
            </div>
            <ul class="space-y-2 text-sm text-gray-400">
              <li class="flex items-start gap-2">
                <span class="text-green-400 mt-0.5 shrink-0">✓</span>
                Los puntos se calculan sobre el resultado al finalizar los 90 minutos reglamentarios.
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-400 mt-0.5 shrink-0">✓</span>
                El tiempo extra y los penales <span class="text-white font-medium">no</span> se tienen en cuenta para el cálculo de puntos.
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-400 mt-0.5 shrink-0">✓</span>
                Podés modificar tu predicción las veces que quieras antes del cierre.
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-400 mt-0.5 shrink-0">✓</span>
                Si no hacés una predicción, ese partido vale 0 puntos.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Criterios de desempate -->
      <section>
        <h2 class="text-xl font-black text-white mb-4 flex items-center gap-2">
          <span class="text-2xl">📊</span> Criterios de Desempate
        </h2>
        <div class="rounded-2xl p-6" style="background:#1E0E13;border:1px solid #2A1219">
          <p class="text-gray-400 text-sm mb-5">En caso de igualdad de puntos, el ranking se define por este orden:</p>
          <div class="space-y-3">
            <div class="flex items-center gap-4 p-3 rounded-xl" style="background:#150A0D">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                   style="background:#f59e0b;color:#0E0608">1</div>
              <div>
                <p class="font-bold text-white text-sm">Mayor número de marcadores exactos</p>
                <p class="text-gray-500 text-xs">Prioridad a la precisión total (+15 pts).</p>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 rounded-xl" style="background:#150A0D">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                   style="background:#6b7280;color:#fff">2</div>
              <div>
                <p class="font-bold text-white text-sm">Mayor número de diferencias exactas</p>
                <p class="text-gray-500 text-xs">Premia al que predijo mejor el margen de victoria (+10 pts).</p>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 rounded-xl" style="background:#150A0D">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                   style="background:#92400e;color:#fff">3</div>
              <div>
                <p class="font-bold text-white text-sm">Fecha de registro más antigua</p>
                <p class="text-gray-500 text-xs">En caso de empate total, gana quien se registró primero.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <div class="rounded-3xl p-8 text-center" style="background:linear-gradient(135deg,rgba(201,168,67,0.08),rgba(201,168,67,0.02));border:1px solid rgba(201,168,67,0.2)">
        <p class="text-2xl font-black text-white mb-2">¿Listo para demostrar tu conocimiento?</p>
        <p class="text-gray-400 text-sm mb-6">Empezá a predecir los próximos encuentros hoy mismo.</p>
        <a routerLink="/mis-apuestas"
           class="inline-flex items-center gap-2 py-3 px-8 rounded-xl font-black uppercase tracking-wider text-sm transition-opacity hover:opacity-90"
           style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
          ⚽ Ir a Mis Apuestas
        </a>
      </div>

    </div>
  `,
})
export class RulesComponent {}
