import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService }        from '../../core/services/auth.service';
import { MatchService }       from '../../core/services/match.service';
import { PredictionService }  from '../../core/services/prediction.service';
import { Match, Prediction, STAGE_LABELS, MatchStage } from '../../core/models';
import { TeamFlagComponent }       from '../../shared/components/team-flag/team-flag.component';
import { ScoreBadgeComponent }     from '../../shared/components/score-badge/score-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent }     from '../../shared/components/empty-state/empty-state.component';
import { MatchDatePipe }           from '../../shared/pipes/match-date.pipe';
import { ConfettiComponent }       from '../../shared/components/confetti/confetti.component';

interface MatchWithPred { match: Match; prediction: Prediction | null; }
interface StageGroup    { label: string; stage: MatchStage; items: MatchWithPred[]; }

@Component({
  selector:        'app-my-bets',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TeamFlagComponent, ScoreBadgeComponent,
            LoadingSpinnerComponent, EmptyStateComponent, MatchDatePipe, ConfettiComponent],
  template: `
    <app-confetti #confetti></app-confetti>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-3xl font-black text-white">Mis Apuestas</h1>
          <p class="text-gray-400 mt-1 text-sm">
            Predecí los resultados y escalá en el ranking.
            Tenés hasta <span style="color:#C9A843" class="font-semibold">30 minutos antes</span> de cada partido.
          </p>
        </div>
        <button *ngIf="countFor('OPEN') > 0" (click)="goToNextPending()"
          class="self-start sm:self-auto shrink-0 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:scale-[1.02]"
          style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#E2C06A;border:1px solid rgba(201,168,67,0.35)">
          🎯 Próximo sin apostar
        </button>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()">

        <!-- Filtros -->
        <div class="sticky top-16 z-30 -mx-4 px-4 py-3 mb-6"
             style="background:rgba(14,6,8,0.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)">
          <div class="flex gap-2 overflow-x-auto pb-1" style="scrollbar-width:none">
            <button *ngFor="let f of filters" (click)="activeFilter.set(f.value)"
              class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              [style.background]="activeFilter()===f.value ? 'linear-gradient(135deg,#C9A843,#A8872E)' : '#1E0E13'"
              [style.color]="activeFilter()===f.value ? '#0E0608' : '#9ca3af'"
              [style.border]="activeFilter()===f.value ? 'none' : '1px solid #2A1219'">
              {{ f.icon }} {{ f.label }}
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                [style.background]="activeFilter()===f.value ? 'rgba(14,6,8,0.25)' : '#2A1219'"
                [style.color]="activeFilter()===f.value ? '#0E0608' : '#C9A843'">
                {{ countFor(f.value) }}
              </span>
            </button>
          </div>
        </div>

        <div *ngFor="let group of filteredGroups()" class="mb-10">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-1 h-6 rounded-full" style="background:#C9A843"></div>
            <h2 class="text-sm font-black text-white uppercase tracking-wider">{{ group.label }}</h2>
          </div>

          <div *ngIf="isKnockoutLocked(group.stage)"
            class="rounded-2xl p-4 flex items-center gap-3 mb-4"
            style="background:#1E0E13;border:1px solid rgba(245,158,11,0.3)">
            <span class="text-2xl">🔒</span>
            <div>
              <p class="font-semibold text-white text-sm">Predicciones bloqueadas</p>
              <p class="text-xs text-gray-400">Se habilitarán al terminar la fase de grupos.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div *ngFor="let item of group.items"
              [id]="'match-' + item.match.id"
              class="rounded-2xl p-4 transition-all"
              [style.opacity]="isKnockoutLocked(group.stage) ? '0.5' : '1'"
              style="background:#1E0E13;border:1px solid #2A1219">

              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-xs font-semibold text-gray-500 uppercase">
                    {{ item.match.group ?? stageLabel(item.match.stage) }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ item.match.utcDate | matchDate:'long' }} · {{ item.match.utcDate | matchDate:'time' }}
                  </p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                  [style.background]="item.match.status==='FINISHED' ? 'rgba(239,68,68,0.15)' :
                                      matchService.canPredict(item.match) ? 'rgba(201,168,67,0.15)' :
                                      item.match.status==='IN_PLAY' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.2)'"
                  [style.color]="item.match.status==='FINISHED' ? '#f87171' :
                                 matchService.canPredict(item.match) ? '#C9A843' :
                                 item.match.status==='IN_PLAY' ? '#fbbf24' : '#9ca3af'">
                  {{ item.match.status==='FINISHED' ? 'Finalizado' :
                     item.match.status==='IN_PLAY'  ? '🔴 En juego' :
                     matchService.canPredict(item.match) ? '● Abierto' : 'Cerrado' }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <div class="flex-1 flex flex-col items-center">
                  <app-team-flag [team]="item.match.homeTeam" size="md"></app-team-flag>
                </div>

                <div class="flex flex-col items-center gap-1 min-w-[100px]">
                  <div *ngIf="item.match.status==='FINISHED'||item.match.status==='IN_PLAY'||item.match.status==='PAUSED'"
                    class="flex items-center gap-2">
                    <span class="text-2xl font-black text-white">{{ item.match.score.fullTime.home ?? '—' }}</span>
                    <span class="text-gray-600">-</span>
                    <span class="text-2xl font-black text-white">{{ item.match.score.fullTime.away ?? '—' }}</span>
                  </div>
                  <ng-container *ngIf="item.prediction">
                    <div class="flex items-center gap-1">
                      <span class="font-bold text-white text-sm">{{ item.prediction.predictedHome }}</span>
                      <span class="text-gray-600 text-xs">-</span>
                      <span class="font-bold text-white text-sm">{{ item.prediction.predictedAway }}</span>
                    </div>
                    <p class="text-xs text-gray-500">Tu predicción</p>
                    <app-score-badge *ngIf="item.prediction.calculated"
                      [result]="item.prediction.result"
                      [points]="item.prediction.points">
                    </app-score-badge>
                  </ng-container>
                  <span *ngIf="!item.prediction && item.match.status==='FINISHED'"
                    class="text-xs px-2 py-0.5 rounded-full" style="background:#374151;color:#9ca3af">
                    Sin predicción
                  </span>
                </div>

                <div class="flex-1 flex flex-col items-center">
                  <app-team-flag [team]="item.match.awayTeam" size="md"></app-team-flag>
                </div>
              </div>

              <div class="mt-4 pt-3" style="border-top:1px solid #2A1219"
                   *ngIf="matchService.canPredict(item.match)">
                <button class="w-full py-2 px-4 rounded-xl text-sm font-semibold text-gray-300 flex items-center justify-center gap-2 hover:text-white transition-colors"
                  style="border:1px solid #2A1219"
                  (click)="openModal(item)">
                  ✏️ {{ item.prediction ? 'Editar predicción' : 'Hacer predicción' }}
                </button>
              </div>

              <div class="mt-2 pt-1" *ngIf="matchService.canPredict(item.match) && matchService.getMinutesUntilCutoff(item.match) < 120">
                <p class="text-xs text-center" style="color:#fbbf24">
                  ⚠️ Cierra en {{ matchService.getMinutesUntilCutoff(item.match) }} minutos
                </p>
              </div>
            </div>
          </div>
        </div>

        <app-empty-state *ngIf="stageGroups().length===0"
          icon="📅" title="No hay partidos cargados"
          description="Los partidos del Mundial 2026 aparecerán aquí.">
        </app-empty-state>

        <app-empty-state *ngIf="stageGroups().length>0 && filteredGroups().length===0"
          icon="✅" title="Nada por aquí"
          description="No hay partidos en esta categoría.">
        </app-empty-state>
      </div>
    </div>

    <!-- Modal predicción -->
    <div *ngIf="modalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="closeModal()">
      <div class="absolute inset-0" style="background:rgba(0,0,0,0.75)"></div>
      <div class="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
           style="background:#1E0E13;border:1px solid #2A1219"
           (click)="$event.stopPropagation()">
        <button (click)="closeModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

        <ng-container *ngIf="selectedItem()">
          <h3 class="text-lg font-black text-white mb-1">
            {{ selectedItem()!.match.homeTeam.shortName }} vs {{ selectedItem()!.match.awayTeam.shortName }}
          </h3>
          <p class="text-xs text-gray-400 mb-6">
            {{ selectedItem()!.match.utcDate | matchDate:'long' }}
          </p>

          <div class="flex items-center justify-center gap-8 mb-6">
            <div class="flex flex-col items-center gap-3">
              <app-team-flag [team]="selectedItem()!.match.homeTeam" size="lg"></app-team-flag>
              <input type="number" min="0" max="99" class="score-input"
                [value]="predHome()" (input)="predHome.set(+$any($event.target).value)"/>
            </div>
            <span class="text-gray-600 font-black text-2xl">-</span>
            <div class="flex flex-col items-center gap-3">
              <app-team-flag [team]="selectedItem()!.match.awayTeam" size="lg"></app-team-flag>
              <input type="number" min="0" max="99" class="score-input"
                [value]="predAway()" (input)="predAway.set(+$any($event.target).value)"/>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-6 text-center">
            <div class="p-2 rounded-xl" style="background:#150A0D">
              <p class="font-black text-lg" style="color:#C9A843">+15</p>
              <p class="text-xs text-gray-400">Exacto</p>
            </div>
            <div class="p-2 rounded-xl" style="background:#150A0D">
              <p class="font-black text-lg text-blue-400">+10</p>
              <p class="text-xs text-gray-400">Diferencia</p>
            </div>
            <div class="p-2 rounded-xl" style="background:#150A0D">
              <p class="font-black text-lg text-amber-400">+5</p>
              <p class="text-xs text-gray-400">Tendencia</p>
            </div>
          </div>

          <div *ngIf="modalError()" class="mb-4 p-3 rounded-xl text-sm text-red-400"
               style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3)">
            {{ modalError() }}
          </div>

          <button (click)="save()" [disabled]="saving()"
            class="w-full py-3 rounded-xl font-black uppercase tracking-wider text-sm disabled:opacity-40"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            {{ saving() ? 'Guardando...' : (selectedItem()!.prediction ? 'Actualizar' : 'Confirmar predicción') }}
          </button>
        </ng-container>
      </div>
    </div>
  `,
})
export class MyBetsComponent implements OnInit {
  private auth              = inject(AuthService);
  readonly matchService     = inject(MatchService);
  private predictionService = inject(PredictionService);

  @ViewChild('confetti') confetti?: ConfettiComponent;

  loading      = signal(true);
  stageGroups  = signal<StageGroup[]>([]);
  modalOpen    = signal(false);
  selectedItem = signal<MatchWithPred | null>(null);
  predHome     = signal(0);
  predAway     = signal(0);
  saving       = signal(false);
  modalError   = signal('');
  activeFilter = signal<'OPEN' | 'PREDICTED' | 'PLAYED' | 'ALL'>('OPEN');

  filters = [
    { value: 'OPEN'      as const, label: 'Por apostar', icon: '🎯' },
    { value: 'PREDICTED' as const, label: 'Apostados',   icon: '✅' },
    { value: 'PLAYED'    as const, label: 'Jugados',     icon: '🏁' },
    { value: 'ALL'       as const, label: 'Todos',       icon: '📋' },
  ];

  ngOnInit(): void {
    this.load();
    // Modo prueba: /mis-apuestas?testConfetti=1
    if (new URLSearchParams(window.location.search).has('testConfetti')) {
      setTimeout(() => this.confetti?.celebrate({
        icon: '🎯', title: '¡Marcador exacto!', message: '1 exacto · +15 puntos',
      }), 600);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    try {
      const [matches, preds] = await Promise.all([
        this.matchService.getAllMatches(),
        this.predictionService.getUserPredictions(uid),
      ]);
      const map = new Map(preds.map(p => [p.matchId, p]));
      const items: MatchWithPred[] = matches.map(m => ({ match: m, prediction: map.get(m.id) ?? null }));
      const order: MatchStage[] = ['GROUP_STAGE','ROUND_OF_32','ROUND_OF_16','QUARTER_FINALS','SEMI_FINALS','THIRD_PLACE','FINAL'];
      const groups = order
        .map(stage => ({ label: STAGE_LABELS[stage], stage, items: items.filter(i => i.match.stage === stage) }))
        .filter(g => g.items.length > 0);
      this.stageGroups.set(groups);
      this.checkForNewHits(items);
    } finally { this.loading.set(false); }
  }

  // ── Festejo por aciertos nuevos ────────────────────────────────────────────
  private checkForNewHits(items: MatchWithPred[]): void {
    const KEY = 'celebrated-predictions';
    const celebrated: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');

    const newHits = items.filter(i =>
      i.prediction?.calculated &&
      (i.prediction.result === 'EXACT' || i.prediction.result === 'GOAL_DIFF') &&
      !celebrated.includes(i.prediction.id)
    );

    if (newHits.length === 0) return;

    // Marcar como festejados (aunque el usuario cierre rápido, no repetir)
    localStorage.setItem(KEY, JSON.stringify([
      ...celebrated, ...newHits.map(i => i.prediction!.id),
    ]));

    const exacts = newHits.filter(i => i.prediction!.result === 'EXACT').length;
    const diffs  = newHits.length - exacts;
    const points = newHits.reduce((s, i) => s + i.prediction!.points, 0);

    const title = newHits.length === 1
      ? (exacts > 0 ? '¡Marcador exacto!' : '¡Acertaste ganador y diferencia!')
      : `¡${newHits.length} aciertos nuevos!`;

    const parts: string[] = [];
    if (exacts > 0) parts.push(`${exacts} exacto${exacts > 1 ? 's' : ''}`);
    if (diffs > 0)  parts.push(`${diffs} con diferencia`);

    setTimeout(() => this.confetti?.celebrate({
      icon:    exacts > 0 ? '🎯' : '🔥',
      title,
      message: `${parts.join(' y ')} · +${points} puntos`,
    }), 400);
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  private matchesFilter(item: MatchWithPred, f: 'OPEN' | 'PREDICTED' | 'PLAYED' | 'ALL'): boolean {
    switch (f) {
      case 'OPEN':      return !item.prediction && this.matchService.canPredict(item.match);
      case 'PREDICTED': return !!item.prediction && item.match.status !== 'FINISHED';
      case 'PLAYED':    return item.match.status === 'FINISHED';
      case 'ALL':       return true;
    }
  }

  countFor(f: 'OPEN' | 'PREDICTED' | 'PLAYED' | 'ALL'): number {
    return this.stageGroups().reduce(
      (sum, g) => sum + g.items.filter(i => this.matchesFilter(i, f)).length, 0);
  }

  filteredGroups(): StageGroup[] {
    const f = this.activeFilter();
    let groups = this.stageGroups()
      .map(g => ({ ...g, items: g.items.filter(i => this.matchesFilter(i, f)) }))
      .filter(g => g.items.length > 0);

    // En "Jugados" mostramos lo más reciente primero (última fase y último partido arriba)
    if (f === 'PLAYED') {
      groups = [...groups].reverse().map(g => ({
        ...g,
        items: [...g.items].sort((a, b) => b.match.utcDate.getTime() - a.match.utcDate.getTime()),
      }));
    }
    return groups;
  }

  goToNextPending(): void {
    // Primer partido por apostar (los grupos ya vienen ordenados por fecha)
    for (const g of this.stageGroups()) {
      const pending = g.items.find(i => this.matchesFilter(i, 'OPEN'));
      if (pending) {
        // Si el filtro activo lo oculta, cambiar a "Por apostar"
        if (this.activeFilter() !== 'OPEN' && this.activeFilter() !== 'ALL') {
          this.activeFilter.set('OPEN');
        }
        setTimeout(() => {
          document.getElementById(`match-${pending.match.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }
  }

  isKnockoutLocked(stage: MatchStage): boolean {
    const ko: MatchStage[] = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINALS','SEMI_FINALS','THIRD_PLACE','FINAL'];
    if (!ko.includes(stage)) return false;
    const gp = this.stageGroups().find(g => g.stage === 'GROUP_STAGE');
    return gp?.items.some(i => i.match.status !== 'FINISHED') ?? false;
  }

  stageLabel(s: string): string { return STAGE_LABELS[s as MatchStage] ?? s; }

  openModal(item: MatchWithPred): void {
    this.selectedItem.set(item);
    this.predHome.set(item.prediction?.predictedHome ?? 0);
    this.predAway.set(item.prediction?.predictedAway ?? 0);
    this.modalError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); this.selectedItem.set(null); }

  async save(): Promise<void> {
    const item = this.selectedItem();
    const uid  = this.auth.currentUser()?.uid;
    if (!item || !uid) return;
    this.saving.set(true); this.modalError.set('');
    try {
      await this.predictionService.savePrediction(uid, item.match, this.predHome(), this.predAway());
      this.closeModal();
      await this.load();
    } catch (e: any) {
      this.modalError.set(e.message ?? 'No se pudo guardar.');
    } finally { this.saving.set(false); }
  }
}
