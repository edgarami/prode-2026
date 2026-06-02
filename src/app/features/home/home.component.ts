import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService }    from '../../core/services/auth.service';
import { MatchService }   from '../../core/services/match.service';
import { RankingService } from '../../core/services/ranking.service';
import { Match, RankingEntry, STAGE_LABELS, MatchStage } from '../../core/models';
import { CountdownComponent }      from '../../shared/components/countdown/countdown.component';
import { TeamFlagComponent }       from '../../shared/components/team-flag/team-flag.component';
import { MatchDatePipe }           from '../../shared/pipes/match-date.pipe';

@Component({
  selector:        'app-home',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CountdownComponent, TeamFlagComponent, MatchDatePipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      <!-- HERO: Próximo partido -->
      <section class="relative rounded-3xl overflow-hidden p-6 sm:p-8"
        style="background:linear-gradient(135deg,#1a2130 0%,#0d1117 60%,#0a1a0a 100%);border:1px solid #1f2940">

        <ng-container *ngIf="nextMatch(); else noMatch">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div class="flex-1">
              <span class="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold"
                    style="background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.3)">
                PRÓXIMO GRAN PARTIDO
              </span>
              <h2 class="text-2xl sm:text-4xl font-black text-white mb-4">
                {{ nextMatch()!.homeTeam.shortName }} vs {{ nextMatch()!.awayTeam.shortName }}
              </h2>
              <app-countdown [targetDate]="nextMatch()!.utcDate"></app-countdown>
              <div class="mt-6">
                <a routerLink="/mis-apuestas"
                  class="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-black uppercase tracking-wider text-sm"
                  style="background:#00FF66;color:#0d1117">
                  ⚽ HACER PREDICCIÓN
                </a>
              </div>
            </div>
            <div class="flex items-center gap-6 sm:gap-10">
              <app-team-flag [team]="nextMatch()!.homeTeam" size="xl"></app-team-flag>
              <span class="text-2xl font-black text-gray-600">VS</span>
              <app-team-flag [team]="nextMatch()!.awayTeam" size="xl"></app-team-flag>
            </div>
          </div>
        </ng-container>

        <ng-template #noMatch>
          <!-- Skeleton mientras carga -->
          <ng-container *ngIf="loadingHero(); else emptyMatch">
            <div class="animate-pulse space-y-4">
              <div class="h-5 rounded-full w-40" style="background:#1f2940"></div>
              <div class="h-10 rounded w-2/3" style="background:#1f2940"></div>
              <div class="h-8 rounded w-1/3" style="background:#1f2940"></div>
            </div>
          </ng-container>
          <ng-template #emptyMatch>
            <div class="text-center py-8">
              <p class="text-5xl mb-3">🏆</p>
              <p class="text-gray-400 font-semibold">No hay partidos próximos programados.</p>
              <p class="text-gray-500 text-sm mt-1">Sincronizá los partidos desde el panel de administración.</p>
            </div>
          </ng-template>
        </ng-template>
      </section>

      <!-- Partidos de Hoy -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-black text-white">Partidos de Hoy</h2>
          <a routerLink="/mis-apuestas" style="color:#00FF66" class="text-sm font-semibold">Ver todo →</a>
        </div>

        <!-- Skeleton partidos -->
        <ng-container *ngIf="loadingMatches()">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let s of [1,2,3]" class="rounded-2xl p-4 animate-pulse" style="background:#1a2130;border:1px solid #1f2940">
              <div class="h-3 rounded w-1/3 mb-4" style="background:#1f2940"></div>
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-full" style="background:#1f2940"></div>
                <div class="h-8 rounded w-16" style="background:#1f2940"></div>
                <div class="w-12 h-12 rounded-full" style="background:#1f2940"></div>
              </div>
            </div>
          </div>
        </ng-container>

        <div *ngIf="!loadingMatches()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ng-container *ngIf="todayMatches().length > 0; else noToday">
            <div *ngFor="let m of todayMatches()"
              class="rounded-2xl p-4 transition-all hover:-translate-y-0.5 cursor-pointer"
              style="background:#1a2130;border:1px solid #1f2940">

              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-semibold"
                  [style.color]="m.status==='IN_PLAY' ? '#f87171' : m.status==='FINISHED' ? '#00FF66' : '#9ca3af'">
                  {{ m.status==='IN_PLAY' ? '🔴 EN VIVO' : m.status==='FINISHED' ? '✅ FINALIZADO' : (m.utcDate | matchDate:'time') }}
                </span>
                <span class="text-xs text-gray-500">{{ m.group ?? stageLabel(m.stage) }}</span>
              </div>

              <div class="flex items-center justify-between">
                <app-team-flag [team]="m.homeTeam" size="md"></app-team-flag>
                <div class="text-center">
                  <span *ngIf="m.status==='FINISHED'||m.status==='IN_PLAY'||m.status==='PAUSED'"
                    class="text-3xl font-black text-white">
                    {{ m.score.fullTime.home ?? 0 }} - {{ m.score.fullTime.away ?? 0 }}
                  </span>
                  <span *ngIf="m.status!=='FINISHED'&&m.status!=='IN_PLAY'&&m.status!=='PAUSED'"
                    class="text-2xl font-black" style="color:#374151">VS</span>
                </div>
                <app-team-flag [team]="m.awayTeam" size="md"></app-team-flag>
              </div>

              <div class="mt-4 pt-3" style="border-top:1px solid #1f2940">
                <a *ngIf="matchService.canPredict(m)" routerLink="/mis-apuestas"
                  class="block text-center text-xs font-semibold py-2 rounded-lg transition-colors text-gray-300 hover:text-white"
                  style="border:1px solid #1f2940">
                  Hacer predicción
                </a>
                <span *ngIf="!matchService.canPredict(m) && m.status!=='FINISHED'"
                  class="block text-center text-xs text-red-400">⏱ Plazo cerrado</span>
                <span *ngIf="m.status==='FINISHED'"
                  class="block text-center text-xs text-gray-500">Partido finalizado</span>
              </div>
            </div>
          </ng-container>
          <ng-template #noToday>
            <div class="col-span-3 text-center py-12">
              <p class="text-4xl mb-3">📅</p>
              <p class="text-gray-400">No hay partidos hoy.</p>
            </div>
          </ng-template>
        </div>
      </section>

      <!-- Top Global + Tu Posición -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <!-- Top Global -->
        <div class="lg:col-span-3 rounded-2xl p-6" style="background:#1a2130;border:1px solid #1f2940">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-black text-white">🏆 Top Global</h2>
            <a routerLink="/ranking" class="text-xs font-semibold" style="color:#00FF66">Ver ranking completo →</a>
          </div>

          <!-- Skeleton ranking -->
          <ng-container *ngIf="loadingRanking()">
            <div class="space-y-3">
              <div *ngFor="let s of [1,2,3,4,5]"
                class="flex items-center gap-4 p-3 rounded-xl animate-pulse" style="background:#111820">
                <div class="w-8 h-8 rounded-full shrink-0" style="background:#1f2940"></div>
                <div class="w-9 h-9 rounded-full shrink-0" style="background:#1f2940"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 rounded w-1/2" style="background:#1f2940"></div>
                  <div class="h-2 rounded w-1/3" style="background:#1f2940"></div>
                </div>
                <div class="h-4 rounded w-12" style="background:#1f2940"></div>
              </div>
            </div>
          </ng-container>

          <div *ngIf="!loadingRanking()" class="space-y-2">
            <ng-container *ngIf="topUsers().length > 0; else emptyRanking">
              <div *ngFor="let u of topUsers(); let i = index"
                class="flex items-center gap-4 p-3 rounded-xl transition-colors"
                [style.background]="i===0 ? 'rgba(0,255,102,0.05)' : 'transparent'">

                <!-- Posición -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                  [style.background]="i===0 ? '#f59e0b' : i===1 ? '#6b7280' : i===2 ? '#92400e' : '#1f2940'"
                  [style.color]="i < 3 ? '#fff' : '#9ca3af'">
                  {{ i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1) }}
                </div>

                <!-- Avatar inicial -->
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                     style="background:#00FF66;color:#0d1117">
                  {{ u.displayName.charAt(0).toUpperCase() }}
                </div>

                <!-- Nombre y stats -->
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-white text-sm truncate">{{ u.displayName }}</p>
                  <p class="text-xs text-gray-500">
                    {{ u.exactScores }} exactos · {{ u.correctWinners }} tendencias
                  </p>
                </div>

                <!-- Puntos -->
                <div class="text-right shrink-0">
                  <span class="font-black text-sm" style="color:#00FF66">{{ u.totalPoints }}</span>
                  <span class="text-xs text-gray-500 ml-1">pts</span>
                </div>
              </div>
            </ng-container>
            <ng-template #emptyRanking>
              <div class="text-center py-8">
                <p class="text-3xl mb-2">👾</p>
                <p class="text-gray-400 text-sm">Aún no hay usuarios en el ranking.</p>
                <p class="text-gray-500 text-xs mt-1">¡Sé el primero en hacer una predicción!</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Tu Posición -->
        <div class="lg:col-span-2 rounded-2xl p-6 flex flex-col" style="background:#1a2130;border:1px solid #1f2940">
          <h2 class="text-lg font-black text-white mb-5">Tu Posición</h2>
          <div class="flex-1 space-y-4">
            <div class="flex items-center justify-between p-4 rounded-xl" style="background:#111820">
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Posición</p>
                <p class="text-3xl font-black" style="color:#00FF66">
                  #{{ userProfile()?.rank ?? '—' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Puntos</p>
                <p class="text-3xl font-black text-white">{{ userProfile()?.totalPoints ?? 0 }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-xl text-center" style="background:#111820">
                <p class="text-2xl font-black" style="color:#00FF66">{{ userProfile()?.exactScores ?? 0 }}</p>
                <p class="text-xs text-gray-400 mt-1">Exactos 🎯</p>
              </div>
              <div class="p-3 rounded-xl text-center" style="background:#111820">
                <p class="text-2xl font-black text-white">{{ userProfile()?.correctWinners ?? 0 }}</p>
                <p class="text-xs text-gray-400 mt-1">Tendencias ✓</p>
              </div>
            </div>
            <a routerLink="/mis-apuestas"
              class="block text-center py-3 px-6 rounded-xl font-black uppercase tracking-wider text-sm transition-opacity hover:opacity-90"
              style="background:#00FF66;color:#0d1117">
              ⚽ Ir a mis apuestas
            </a>
          </div>
        </div>
      </div>

      <!-- Resumen del sistema de puntos -->
      <section class="rounded-3xl overflow-hidden" style="background:#1a2130;border:1px solid #1f2940">
        <div class="p-6 sm:p-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 class="text-xl font-black text-white">⚽ ¿Cómo se puntúa?</h2>
              <p class="text-gray-400 text-sm mt-1">Predecí resultados y sumá puntos en el ranking global.</p>
            </div>
            <a routerLink="/reglas"
              class="self-start sm:self-auto text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:opacity-80 shrink-0"
              style="border:1px solid #00FF66;color:#00FF66">
              Ver reglas completas →
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- +15 -->
            <div class="rounded-2xl p-4 flex items-start gap-4" style="background:#111820;border:1px solid #1f2940">
              <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                   style="background:rgba(0,255,102,0.15);color:#00FF66">
                +15
              </div>
              <div>
                <p class="font-bold text-white text-sm">Marcador Exacto</p>
                <p class="text-gray-400 text-xs mt-1">Adiviná el resultado exacto del partido.</p>
                <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:rgba(0,255,102,0.1);color:#00FF66">MÁXIMA RECOMPENSA</span>
              </div>
            </div>
            <!-- +10 -->
            <div class="rounded-2xl p-4 flex items-start gap-4" style="background:#111820;border:1px solid #1f2940">
              <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                   style="background:rgba(245,158,11,0.15);color:#f59e0b">
                +10
              </div>
              <div>
                <p class="font-bold text-white text-sm">Ganador y Diferencia</p>
                <p class="text-gray-400 text-xs mt-1">Adiviná quién gana y por cuántos goles.</p>
                <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:rgba(245,158,11,0.1);color:#f59e0b">ESTRATEGA EXPERTO</span>
              </div>
            </div>
            <!-- +5 -->
            <div class="rounded-2xl p-4 flex items-start gap-4" style="background:#111820;border:1px solid #1f2940">
              <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                   style="background:rgba(96,165,250,0.15);color:#60a5fa">
                +5
              </div>
              <div>
                <p class="font-bold text-white text-sm">Ganador o Empate</p>
                <p class="text-gray-400 text-xs mt-1">Adiviná el resultado final sin importar el marcador.</p>
                <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:rgba(96,165,250,0.1);color:#60a5fa">TENDENCIA</span>
              </div>
            </div>
          </div>

          <!-- Cierre de apuestas -->
          <div class="mt-4 flex items-center gap-3 p-3 rounded-xl" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2)">
            <span class="text-xl shrink-0">⏱</span>
            <p class="text-sm text-amber-300">
              <span class="font-bold">Cierre de apuestas:</span> todas las predicciones deben hacerse al menos
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

  ngOnInit(): void { this.load(); }

  private async load(): Promise<void> {
    // Carga independiente para que un fallo no bloquee el resto
    this.loadNextMatch();
    this.loadTodayMatches();
    this.loadRanking();
  }

  private async loadNextMatch(): Promise<void> {
    try {
      const m = await this.matchService.getNextBigMatch();
      this.nextMatch.set(m);
    } catch (e) {
      console.error('Error cargando próximo partido:', e);
    } finally {
      this.loadingHero.set(false);
      this.cdr.markForCheck();
    }
  }

  private async loadTodayMatches(): Promise<void> {
    try {
      const ms = await this.matchService.getTodayMatches();
      this.todayMatches.set(ms);
    } catch (e) {
      console.error('Error cargando partidos de hoy:', e);
    } finally {
      this.loadingMatches.set(false);
      this.cdr.markForCheck();
    }
  }

  private async loadRanking(): Promise<void> {
    try {
      const result = await this.rankingService.getRanking(5);
      const entries = result.entries.map((e, i) => ({ ...e, rank: i + 1 }));
      this.topUsers.set(entries);
    } catch (e) {
      console.error('Error cargando ranking:', e);
      this.topUsers.set([]);
    } finally {
      this.loadingRanking.set(false);
      this.cdr.markForCheck();
    }
  }

  stageLabel(s: string): string { return STAGE_LABELS[s as MatchStage] ?? s; }
}
