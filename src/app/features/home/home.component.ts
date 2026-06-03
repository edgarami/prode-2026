import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService }    from '../../core/services/auth.service';
import { MatchService }   from '../../core/services/match.service';
import { RankingService } from '../../core/services/ranking.service';
import { Match, RankingEntry, STAGE_LABELS, MatchStage } from '../../core/models';
import { CountdownComponent } from '../../shared/components/countdown/countdown.component';
import { TeamFlagComponent }  from '../../shared/components/team-flag/team-flag.component';
import { MatchDatePipe }      from '../../shared/pipes/match-date.pipe';

@Component({
  selector:        'app-home',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CountdownComponent, TeamFlagComponent, MatchDatePipe],
  template: `

    <!-- ══════════════════════════════════════════════════
         HERO BANNER — Próximo partido
    ══════════════════════════════════════════════════ -->
    <section class="relative overflow-hidden" style="min-height:420px;background:#0E0608">

      <!-- Fondo SVG estadio -->
      <div class="absolute inset-0 w-full h-full" aria-hidden="true">
        <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMid slice"
             xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <defs>
            <radialGradient id="stadiumGlow" cx="50%" cy="70%" r="60%">
              <stop offset="0%"   stop-color="#7B1F35" stop-opacity="0.6"/>
              <stop offset="60%"  stop-color="#3D0E1C" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#0E0608" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="goldSpot" cx="50%" cy="100%" r="50%">
              <stop offset="0%"   stop-color="#C9A843" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="#C9A843" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#1A4A1A" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#0E0608" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- Fondo base oscuro vinotinto -->
          <rect width="1440" height="500" fill="#0E0608"/>
          <rect width="1440" height="500" fill="url(#stadiumGlow)"/>

          <!-- Campo de fútbol estilizado -->
          <ellipse cx="720" cy="520" rx="600" ry="220" fill="url(#fieldGrad)"/>

          <!-- Líneas del campo -->
          <g stroke="#2D6B2D" stroke-width="1.5" fill="none" opacity="0.4">
            <!-- Círculo central -->
            <circle cx="720" cy="400" r="100"/>
            <!-- Línea central -->
            <line x1="120" y1="400" x2="1320" y2="400"/>
            <!-- Área grande izquierda -->
            <rect x="120" y="320" width="180" height="160"/>
            <!-- Área grande derecha -->
            <rect x="1140" y="320" width="180" height="160"/>
            <!-- Área chica izquierda -->
            <rect x="120" y="350" width="80" height="100"/>
            <!-- Área chica derecha -->
            <rect x="1240" y="350" width="80" height="100"/>
          </g>

          <!-- Luz cenital dorada -->
          <ellipse cx="720" cy="0" rx="400" ry="300" fill="#C9A843" opacity="0.05"/>

          <!-- Graderías laterales izquierda -->
          <g opacity="0.25">
            <path d="M0,500 L0,200 Q80,180 160,200 L160,500Z" fill="#7B1F35"/>
            <path d="M0,500 L0,220 Q60,200 120,220 L120,500Z" fill="#5A1525"/>
          </g>
          <!-- Graderías laterales derecha -->
          <g opacity="0.25">
            <path d="M1440,500 L1440,200 Q1360,180 1280,200 L1280,500Z" fill="#7B1F35"/>
            <path d="M1440,500 L1440,220 Q1380,200 1320,220 L1320,500Z" fill="#5A1525"/>
          </g>

          <!-- Estrellas decorativas -->
          <g fill="#C9A843" opacity="0.6">
            <polygon points="200,80 206,98 224,98 210,108 215,126 200,116 185,126 190,108 176,98 194,98" transform="scale(0.6) translate(200,60)"/>
            <polygon points="1200,60 1206,78 1224,78 1210,88 1215,106 1200,96 1185,106 1190,88 1176,78 1194,78" transform="scale(0.5) translate(1200,40)"/>
            <polygon points="1000,30 1004,42 1016,42 1007,50 1010,62 1000,55 990,62 993,50 984,42 996,42" transform="scale(0.4) translate(1400,20)"/>
            <circle cx="350" cy="50" r="2"/>
            <circle cx="1100" cy="80" r="2"/>
            <circle cx="250" cy="150" r="1.5"/>
            <circle cx="1300" cy="120" r="1.5"/>
          </g>

          <!-- Overlay gradiente inferior -->
          <rect width="1440" height="500" fill="url(#goldSpot)"/>
          <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="60%" stop-color="#0E0608" stop-opacity="0"/>
            <stop offset="100%" stop-color="#0E0608" stop-opacity="1"/>
          </linearGradient>
          <rect width="1440" height="500" fill="url(#botFade)"/>
        </svg>
      </div>

      <!-- Contenido del hero -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        <!-- Skeleton cargando -->
        <ng-container *ngIf="loadingHero()">
          <div class="animate-pulse space-y-4 max-w-lg">
            <div class="h-5 rounded-full w-40 skeleton"></div>
            <div class="h-12 rounded-xl w-3/4 skeleton"></div>
            <div class="h-8 rounded w-1/2 skeleton"></div>
          </div>
        </ng-container>

        <ng-container *ngIf="!loadingHero()">

          <!-- Hay partido próximo -->
          <ng-container *ngIf="nextMatch(); else emptyHero">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

              <div class="flex-1 animate-fade-in">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                     style="background:rgba(201,168,67,0.15);color:#C9A843;border:1px solid rgba(201,168,67,0.4)">
                  <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block"></span>
                  PRÓXIMO GRAN PARTIDO · MUNDIAL 2026
                </div>

                <h1 class="text-3xl sm:text-5xl font-black text-white mb-2 leading-tight">
                  {{ nextMatch()!.homeTeam.shortName }}
                  <span class="mx-2" style="color:#C9A843">vs</span>
                  {{ nextMatch()!.awayTeam.shortName }}
                </h1>

                <p class="text-sm mb-6" style="color:#9B2D47">
                  {{ nextMatch()!.group ?? stageLabel(nextMatch()!.stage) }}
                </p>

                <app-countdown [targetDate]="nextMatch()!.utcDate"></app-countdown>

                <div class="mt-8 flex flex-wrap gap-3">
                  <a routerLink="/mis-apuestas"
                    class="inline-flex items-center gap-2 py-3 px-7 rounded-xl font-black uppercase tracking-wider text-sm transition-all hover:scale-105"
                    style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608;box-shadow:0 0 24px rgba(201,168,67,0.4)">
                    ⚽ Hacer Predicción
                  </a>
                  <a routerLink="/ranking"
                    class="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                    style="border:1px solid rgba(201,168,67,0.3);color:#C9A843">
                    🏆 Ver Ranking
                  </a>
                </div>
              </div>

              <!-- Escudos equipos -->
              <div class="flex items-center gap-6 sm:gap-10 animate-slide-up">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center shadow-card"
                       style="background:rgba(123,31,53,0.3);border:1px solid rgba(201,168,67,0.2)">
                    <app-team-flag [team]="nextMatch()!.homeTeam" size="xl"></app-team-flag>
                  </div>
                  <span class="text-xs font-bold text-white uppercase tracking-widest">{{ nextMatch()!.homeTeam.tla }}</span>
                </div>

                <div class="flex flex-col items-center gap-1">
                  <span class="text-3xl font-black" style="color:#C9A843">VS</span>
                  <span class="text-xs text-gray-500">{{ nextMatch()!.utcDate | matchDate:'short' }}</span>
                </div>

                <div class="flex flex-col items-center gap-3">
                  <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center shadow-card"
                       style="background:rgba(123,31,53,0.3);border:1px solid rgba(201,168,67,0.2)">
                    <app-team-flag [team]="nextMatch()!.awayTeam" size="xl"></app-team-flag>
                  </div>
                  <span class="text-xs font-bold text-white uppercase tracking-widest">{{ nextMatch()!.awayTeam.tla }}</span>
                </div>
              </div>

            </div>
          </ng-container>

          <ng-template #emptyHero>
            <div class="text-center py-10">
              <div class="text-6xl mb-4 animate-float inline-block">🏆</div>
              <p class="text-xl font-black text-white mb-2">¡El Mundial 2026 se acerca!</p>
              <p class="text-gray-400 text-sm">Sincronizá los partidos desde el panel de administración.</p>
            </div>
          </ng-template>

        </ng-container>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      <!-- ══ PARTIDOS DE HOY ══════════════════════════════ -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-black text-white flex items-center gap-2">
            <span style="color:#C9A843">⚽</span> Partidos de Hoy
          </h2>
          <a routerLink="/mis-apuestas" class="text-sm font-semibold transition-colors hover:opacity-80"
             style="color:#C9A843">Ver todos →</a>
        </div>

        <ng-container *ngIf="loadingMatches()">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let s of [1,2,3]" class="rounded-2xl p-4" style="background:#1E0E13;border:1px solid #2A1219">
              <div class="h-3 rounded w-1/3 mb-4 skeleton"></div>
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-full skeleton"></div>
                <div class="h-8 rounded w-16 skeleton"></div>
                <div class="w-12 h-12 rounded-full skeleton"></div>
              </div>
            </div>
          </div>
        </ng-container>

        <div *ngIf="!loadingMatches()">
          <ng-container *ngIf="todayMatches().length > 0; else noToday">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let m of todayMatches()" class="card-hover rounded-2xl p-4 cursor-pointer"
                   style="background:#1E0E13;border:1px solid #2A1219">

                <div class="flex items-center justify-between mb-4">
                  <span class="text-xs font-semibold flex items-center gap-1"
                    [style.color]="m.status==='IN_PLAY' ? '#f87171' : m.status==='FINISHED' ? '#C9A843' : '#9ca3af'">
                    <span *ngIf="m.status==='IN_PLAY'" class="live-dot"></span>
                    {{ m.status==='IN_PLAY' ? '🔴 EN VIVO' : m.status==='FINISHED' ? '✅ FINALIZADO' : (m.utcDate | matchDate:'time') }}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full"
                        style="background:rgba(123,31,53,0.3);color:#9B2D47">
                    {{ m.group ?? stageLabel(m.stage) }}
                  </span>
                </div>

                <div class="flex items-center justify-between my-2">
                  <app-team-flag [team]="m.homeTeam" size="md"></app-team-flag>
                  <div class="text-center">
                    <span *ngIf="m.status==='FINISHED'||m.status==='IN_PLAY'||m.status==='PAUSED'"
                      class="text-3xl font-black text-white">
                      {{ m.score.fullTime.home ?? 0 }} - {{ m.score.fullTime.away ?? 0 }}
                    </span>
                    <span *ngIf="m.status!=='FINISHED'&&m.status!=='IN_PLAY'&&m.status!=='PAUSED'"
                      class="text-2xl font-black" style="color:#3D0E1C">VS</span>
                  </div>
                  <app-team-flag [team]="m.awayTeam" size="md"></app-team-flag>
                </div>

                <div class="mt-4 pt-3" style="border-top:1px solid #2A1219">
                  <a *ngIf="matchService.canPredict(m)" routerLink="/mis-apuestas"
                    class="block text-center text-xs font-bold py-2 rounded-lg transition-all hover:opacity-80"
                    style="background:rgba(201,168,67,0.1);color:#C9A843;border:1px solid rgba(201,168,67,0.2)">
                    Hacer predicción →
                  </a>
                  <span *ngIf="!matchService.canPredict(m) && m.status!=='FINISHED'"
                    class="block text-center text-xs text-red-400">⏱ Plazo cerrado</span>
                  <span *ngIf="m.status==='FINISHED'"
                    class="block text-center text-xs" style="color:#C9A843">Partido finalizado</span>
                </div>
              </div>
            </div>
          </ng-container>
          <ng-template #noToday>
            <div class="text-center py-14 rounded-2xl" style="background:#1E0E13;border:1px solid #2A1219">
              <p class="text-4xl mb-3">📅</p>
              <p class="font-semibold text-gray-300">No hay partidos hoy.</p>
            </div>
          </ng-template>
        </div>
      </section>

      <!-- ══ BANNER INFORMATIVO ═══════════════════════════ -->
      <section class="relative rounded-3xl overflow-hidden"
               style="background:#1E0E13;border:1px solid #2A1219;min-height:160px">
        <!-- SVG decorativo -->
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 900 160" preserveAspectRatio="xMidYMid slice"
               class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bannerGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#7B1F35" stop-opacity="0.5"/>
                <stop offset="50%"  stop-color="#3D0E1C" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#1E0E13" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <rect width="900" height="160" fill="url(#bannerGrad)"/>
            <!-- Balón SVG decorativo -->
            <g transform="translate(780,80)" opacity="0.12">
              <circle r="60" fill="none" stroke="#C9A843" stroke-width="2"/>
              <circle r="20" fill="#C9A843"/>
              <line x1="0" y1="-60" x2="0" y2="60"   stroke="#C9A843" stroke-width="1.5"/>
              <line x1="-60" y1="0" x2="60" y2="0"   stroke="#C9A843" stroke-width="1.5"/>
              <line x1="-42" y1="-42" x2="42" y2="42" stroke="#C9A843" stroke-width="1.5"/>
              <line x1="42" y1="-42" x2="-42" y2="42" stroke="#C9A843" stroke-width="1.5"/>
            </g>
            <!-- Copa -->
            <g transform="translate(820,80) scale(0.9)" opacity="0.1" fill="#C9A843">
              <path d="M-20,-50 Q-30,-20 -15,0 Q-10,15 0,20 Q10,15 15,0 Q30,-20 20,-50Z"/>
              <rect x="-8" y="20" width="16" height="25"/>
              <rect x="-18" y="42" width="36" height="6" rx="3"/>
            </g>
          </svg>
        </div>
        <div class="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color:#9B2D47">MUNDIAL 2026 · USA · CANADA · MEXICO</p>
            <h3 class="text-xl sm:text-2xl font-black text-white">¿Ya hiciste tus predicciones de hoy?</h3>
            <p class="text-gray-400 text-sm mt-1">Cerrá tus apuestas antes de los 30 minutos previos al partido.</p>
          </div>
          <a routerLink="/mis-apuestas"
            class="shrink-0 inline-flex items-center gap-2 py-3 px-6 rounded-xl font-black text-sm transition-all hover:scale-105"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            ⚽ Ver mis apuestas
          </a>
        </div>
      </section>

      <!-- ══ TOP GLOBAL + TU POSICIÓN ════════════════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <!-- Top Global -->
        <div class="lg:col-span-3 rounded-2xl p-6" style="background:#1E0E13;border:1px solid #2A1219">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-black text-white flex items-center gap-2">
              🏆 <span>Top Global</span>
            </h2>
            <a routerLink="/ranking" class="text-xs font-semibold hover:opacity-80"
               style="color:#C9A843">Ver ranking →</a>
          </div>

          <ng-container *ngIf="loadingRanking()">
            <div class="space-y-3">
              <div *ngFor="let s of [1,2,3,4,5]"
                class="flex items-center gap-4 p-3 rounded-xl" style="background:#150A0D">
                <div class="w-8 h-8 rounded-full skeleton shrink-0"></div>
                <div class="w-9 h-9 rounded-full skeleton shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 rounded w-1/2 skeleton"></div>
                  <div class="h-2 rounded w-1/3 skeleton"></div>
                </div>
                <div class="h-4 rounded w-12 skeleton"></div>
              </div>
            </div>
          </ng-container>

          <div *ngIf="!loadingRanking()" class="space-y-2">
            <ng-container *ngIf="topUsers().length > 0; else emptyRanking">
              <div *ngFor="let u of topUsers(); let i = index"
                class="flex items-center gap-3 p-3 rounded-xl transition-colors"
                [style.background]="i===0 ? 'rgba(201,168,67,0.07)' : 'transparent'">

                <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                  [style.background]="i===0?'#C9A843':i===1?'#6b7280':i===2?'#92400e':'#2A1219'"
                  [style.color]="i<3?'#0E0608':'#9ca3af'">
                  {{ i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1) }}
                </div>

                <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                     style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#C9A843">
                  {{ u.displayName.charAt(0).toUpperCase() }}
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-bold text-white text-sm truncate">{{ u.displayName }}</p>
                  <p class="text-xs text-gray-500">{{ u.exactScores }} exactos · {{ u.correctWinners }} tend.</p>
                </div>

                <div class="text-right shrink-0">
                  <span class="font-black text-sm" style="color:#C9A843">{{ u.totalPoints }}</span>
                  <span class="text-xs text-gray-500 ml-1">pts</span>
                </div>
              </div>
            </ng-container>
            <ng-template #emptyRanking>
              <div class="text-center py-8">
                <p class="text-3xl mb-2">👾</p>
                <p class="text-gray-400 text-sm">¡Sé el primero en hacer una predicción!</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Tu Posición -->
        <div class="lg:col-span-2 rounded-2xl p-6 flex flex-col" style="background:#1E0E13;border:1px solid #2A1219">
          <h2 class="text-lg font-black text-white mb-5">Tu Posición</h2>
          <div class="flex-1 space-y-4">
            <div class="flex items-center justify-between p-4 rounded-xl" style="background:#150A0D">
              <div>
                <p class="text-xs uppercase tracking-wider mb-1" style="color:#7B1F35">Posición</p>
                <p class="text-3xl font-black" style="color:#C9A843">#{{ userProfile()?.rank ?? '—' }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs uppercase tracking-wider mb-1" style="color:#7B1F35">Puntos</p>
                <p class="text-3xl font-black text-white">{{ userProfile()?.totalPoints ?? 0 }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-xl text-center" style="background:#150A0D">
                <p class="text-2xl font-black" style="color:#C9A843">{{ userProfile()?.exactScores ?? 0 }}</p>
                <p class="text-xs text-gray-400 mt-1">Exactos 🎯</p>
              </div>
              <div class="p-3 rounded-xl text-center" style="background:#150A0D">
                <p class="text-2xl font-black text-white">{{ userProfile()?.correctWinners ?? 0 }}</p>
                <p class="text-xs text-gray-400 mt-1">Tendencias ✓</p>
              </div>
            </div>
            <a routerLink="/mis-apuestas"
              class="block text-center py-3 px-6 rounded-xl font-black uppercase tracking-wider text-sm transition-all hover:scale-105 hover:opacity-90"
              style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
              ⚽ Ir a mis apuestas
            </a>
          </div>
        </div>
      </div>

      <!-- ══ RESUMEN DE PUNTOS ════════════════════════════ -->
      <section class="rounded-3xl overflow-hidden" style="background:#1E0E13;border:1px solid #2A1219">
        <div class="p-6 sm:p-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 class="text-xl font-black text-white">⚽ ¿Cómo se puntúa?</h2>
              <p class="text-gray-400 text-sm mt-1">Predecí resultados y sumá puntos en el ranking global.</p>
            </div>
            <a routerLink="/reglas"
              class="self-start sm:self-auto text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80 shrink-0"
              style="border:1px solid rgba(201,168,67,0.4);color:#C9A843">
              Ver reglas completas →
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="rounded-2xl p-4 flex items-start gap-4" style="background:#150A0D;border:1px solid #2A1219">
              <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                   style="background:rgba(201,168,67,0.15);color:#C9A843">+15</div>
              <div>
                <p class="font-bold text-white text-sm">Marcador Exacto</p>
                <p class="text-gray-400 text-xs mt-1">Resultado idéntico al final.</p>
                <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:rgba(201,168,67,0.1);color:#C9A843">MÁXIMA</span>
              </div>
            </div>
            <div class="rounded-2xl p-4 flex items-start gap-4" style="background:#150A0D;border:1px solid #2A1219">
              <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                   style="background:rgba(123,31,53,0.3);color:#9B2D47">+10</div>
              <div>
                <p class="font-bold text-white text-sm">Ganador y Diferencia</p>
                <p class="text-gray-400 text-xs mt-1">Ganador correcto y diferencia exacta.</p>
                <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:rgba(123,31,53,0.2);color:#9B2D47">EXPERTO</span>
              </div>
            </div>
            <div class="rounded-2xl p-4 flex items-start gap-4" style="background:#150A0D;border:1px solid #2A1219">
              <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                   style="background:rgba(96,165,250,0.1);color:#60a5fa">+5</div>
              <div>
                <p class="font-bold text-white text-sm">Tendencia</p>
                <p class="text-gray-400 text-xs mt-1">Solo el ganador o empate.</p>
                <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:rgba(96,165,250,0.08);color:#60a5fa">BÁSICO</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3 p-3 rounded-xl"
               style="background:rgba(201,168,67,0.06);border:1px solid rgba(201,168,67,0.15)">
            <span class="text-xl shrink-0">⏱</span>
            <p class="text-sm" style="color:#E2C06A">
              <span class="font-bold">Cierre:</span> las predicciones se bloquean
              <span class="font-bold">30 minutos antes</span> del inicio del partido.
            </p>
          </div>
        </div>
      </section>

    </div>
  `,
})
export class HomeComponent implements OnInit {
  private authService   = inject(AuthService);
  readonly matchService = inject(MatchService);
  private rankingService= inject(RankingService);
  private cdr           = inject(ChangeDetectorRef);

  userProfile    = this.authService.userProfile;
  nextMatch      = signal<Match | null>(null);
  todayMatches   = signal<Match[]>([]);
  topUsers       = signal<RankingEntry[]>([]);
  loadingHero    = signal(true);
  loadingMatches = signal(true);
  loadingRanking = signal(true);

  ngOnInit(): void {
    this.loadNextMatch();
    this.loadTodayMatches();
    this.loadRanking();
  }

  private async loadNextMatch(): Promise<void> {
    try {
      const m = await this.matchService.getNextBigMatch();
      this.nextMatch.set(m);
    } catch (e) { console.error(e); }
    finally { this.loadingHero.set(false); this.cdr.markForCheck(); }
  }

  private async loadTodayMatches(): Promise<void> {
    try {
      const ms = await this.matchService.getTodayMatches();
      this.todayMatches.set(ms);
    } catch (e) { console.error(e); }
    finally { this.loadingMatches.set(false); this.cdr.markForCheck(); }
  }

  private async loadRanking(): Promise<void> {
    try {
      const result = await this.rankingService.getRanking(5);
      this.topUsers.set(result.entries.map((e, i) => ({ ...e, rank: i + 1 })));
    } catch (e) { console.error(e); this.topUsers.set([]); }
    finally { this.loadingRanking.set(false); this.cdr.markForCheck(); }
  }

  stageLabel(s: string): string { return STAGE_LABELS[s as MatchStage] ?? s; }
}
