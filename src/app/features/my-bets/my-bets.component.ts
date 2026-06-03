import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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

interface MatchWithPred { match: Match; prediction: Prediction | null; }
interface StageGroup    { label: string; stage: MatchStage; items: MatchWithPred[]; }

@Component({
  selector:        'app-my-bets',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TeamFlagComponent, ScoreBadgeComponent,
            LoadingSpinnerComponent, EmptyStateComponent, MatchDatePipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-white">Mis Apuestas</h1>
        <p class="text-gray-400 mt-1 text-sm">
          Predecí los resultados y escalá en el ranking.
          Tenés hasta <span style="color:#C9A843" class="font-semibold">30 minutos antes</span> de cada partido.
        </p>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()">
        <div *ngFor="let group of stageGroups()" class="mb-10">
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

  loading      = signal(true);
  stageGroups  = signal<StageGroup[]>([]);
  modalOpen    = signal(false);
  selectedItem = signal<MatchWithPred | null>(null);
  predHome     = signal(0);
  predAway     = signal(0);
  saving       = signal(false);
  modalError   = signal('');

  ngOnInit(): void { this.load(); }

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
    } finally { this.loading.set(false); }
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
