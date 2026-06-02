import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { MatchService }        from '../../core/services/match.service';
import { FootballApiService }  from '../../core/services/football-api.service';
import { PredictionService }   from '../../core/services/prediction.service';
import { Match, STAGE_LABELS, MatchStage } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TeamFlagComponent }       from '../../shared/components/team-flag/team-flag.component';
import { MatchDatePipe }           from '../../shared/pipes/match-date.pipe';

@Pipe({ name: 'finishedCount', standalone: true, pure: true })
export class FinishedCountPipe implements PipeTransform {
  transform(matches: Match[]): number { return matches.filter(m => m.status === 'FINISHED').length; }
}

@Component({
  selector:        'app-admin',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent, TeamFlagComponent, MatchDatePipe, FinishedCountPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-white">Panel de Administración</h1>
          <p class="text-gray-400 text-sm mt-1">Gestión de partidos, resultados y cálculo de puntos.</p>
        </div>
        <span class="px-3 py-1.5 rounded-full text-sm font-semibold" style="background:rgba(245,158,11,0.2);color:#fbbf24;border:1px solid rgba(245,158,11,0.3)">
          ⚙️ Admin
        </span>
      </div>

      <!-- Acciones rápidas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="rounded-2xl p-5" style="background:#1a2130;border:1px solid #1f2940">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">🔄</span> Sincronizar desde API</h3>
          <p class="text-gray-400 text-xs mb-4">Importa todos los partidos desde football-data.org.</p>
          <button (click)="syncAll()" [disabled]="syncing()"
            class="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style="background:#00FF66;color:#0d1117">
            {{ syncing() ? 'Sincronizando...' : 'Sincronizar partidos' }}
          </button>
          <p *ngIf="syncMsg()" class="mt-2 text-xs" [style.color]="syncErr() ? '#f87171' : '#00FF66'">{{ syncMsg() }}</p>
        </div>

        <div class="rounded-2xl p-5" style="background:#1a2130;border:1px solid #1f2940">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">🏆</span> Actualizar resultados</h3>
          <p class="text-gray-400 text-xs mb-4">Trae resultados finalizados y recalcula puntos.</p>
          <button (click)="syncFinished()" [disabled]="calculating()"
            class="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style="border:1px solid #1f2940">
            {{ calculating() ? 'Procesando...' : 'Actualizar y calcular' }}
          </button>
          <p *ngIf="calcMsg()" class="mt-2 text-xs" [style.color]="calcErr() ? '#f87171' : '#00FF66'">{{ calcMsg() }}</p>
        </div>

        <div class="rounded-2xl p-5" style="background:#1a2130;border:1px solid #1f2940">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">📊</span> Estadísticas</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Total partidos</span>
              <span class="font-bold text-white">{{ matches().length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Finalizados</span>
              <span class="font-bold" style="color:#00FF66">{{ matches() | finishedCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Pendientes</span>
              <span class="font-bold text-amber-400">{{ matches().length - (matches() | finishedCount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista partidos -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-black text-white">Gestión de Partidos</h2>
          <input type="text" placeholder="Filtrar..." [(ngModel)]="filter"
            class="w-48 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none"
            style="background:#1f2940;border:1px solid #1f2940"/>
        </div>

        <app-loading-spinner *ngIf="loadingMatches()"></app-loading-spinner>

        <div *ngIf="!loadingMatches()" class="space-y-3">
          <div *ngFor="let m of filteredMatches(); trackBy: trackId"
            class="rounded-2xl p-4" style="background:#1a2130;border:1px solid #1f2940">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex items-center gap-4 flex-1">
                <app-team-flag [team]="m.homeTeam" size="sm"></app-team-flag>
                <div class="text-center min-w-[90px]">
                  <p *ngIf="m.status==='FINISHED'" class="font-black text-white">
                    {{ m.score.fullTime.home }} - {{ m.score.fullTime.away }}
                  </p>
                  <p *ngIf="m.status!=='FINISHED'" class="text-gray-400 text-xs">
                    {{ m.utcDate | matchDate:'time' }}<br/>{{ m.utcDate | matchDate:'short' }}
                  </p>
                </div>
                <app-team-flag [team]="m.awayTeam" size="sm"></app-team-flag>
              </div>

              <div class="hidden sm:block text-xs text-gray-400 min-w-[120px]">
                <p class="font-semibold text-gray-300">{{ m.group ?? stageLabel(m.stage) }}</p>
                <p>#{{ m.id }}</p>
              </div>

              <span class="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                [style.background]="m.status==='FINISHED' ? 'rgba(0,255,102,0.15)' :
                                    m.status==='IN_PLAY'   ? 'rgba(245,158,11,0.15)' :
                                    'rgba(59,130,246,0.15)'"
                [style.color]="m.status==='FINISHED' ? '#00FF66' :
                               m.status==='IN_PLAY'   ? '#fbbf24' : '#60a5fa'">
                {{ m.status }}
              </span>

              <div class="flex gap-2 shrink-0">
                <button *ngIf="m.status!=='FINISHED'" (click)="openResult(m)"
                  class="py-1.5 px-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                  style="border:1px solid #1f2940">
                  ✏️ Resultado
                </button>
                <button *ngIf="m.status==='FINISHED'" (click)="recalc(m)"
                  [disabled]="recalcId()===m.id"
                  class="py-1.5 px-3 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
                  style="color:#00FF66">
                  {{ recalcId()===m.id ? '...' : '🔄 Recalc' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal resultado -->
    <div *ngIf="resultOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeResult()">
      <div class="absolute inset-0" style="background:rgba(0,0,0,0.75)"></div>
      <div class="relative w-full max-w-sm rounded-2xl p-6" style="background:#1a2130;border:1px solid #1f2940"
           (click)="$event.stopPropagation()">
        <h3 class="text-lg font-black text-white mb-1">Cargar resultado</h3>
        <p *ngIf="selMatch()" class="text-gray-400 text-sm mb-5">
          {{ selMatch()!.homeTeam.tla }} vs {{ selMatch()!.awayTeam.tla }}
        </p>

        <form [formGroup]="resultForm" (ngSubmit)="saveResult()" class="space-y-4">
          <div class="flex items-center gap-6 justify-center">
            <div class="flex flex-col items-center gap-2">
              <app-team-flag *ngIf="selMatch()" [team]="selMatch()!.homeTeam" size="md"></app-team-flag>
              <input type="number" formControlName="homeScore" min="0" max="99" class="score-input"/>
            </div>
            <span class="text-gray-600 font-black text-2xl">-</span>
            <div class="flex flex-col items-center gap-2">
              <app-team-flag *ngIf="selMatch()" [team]="selMatch()!.awayTeam" size="md"></app-team-flag>
              <input type="number" formControlName="awayScore" min="0" max="99" class="score-input"/>
            </div>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" formControlName="calcPoints" class="rounded w-4 h-4"/>
            <span class="text-sm text-gray-300">Calcular puntos automáticamente</span>
          </label>
          <div class="flex gap-3">
            <button type="submit" [disabled]="savingResult()"
              class="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
              style="background:#00FF66;color:#0d1117">
              {{ savingResult() ? 'Guardando...' : 'Confirmar' }}
            </button>
            <button type="button" (click)="closeResult()"
              class="py-2.5 px-4 rounded-xl text-sm text-gray-400 hover:text-white" style="border:1px solid #1f2940">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private matchService       = inject(MatchService);
  private footballApiService = inject(FootballApiService);
  private predictionService  = inject(PredictionService);
  private fb                 = inject(FormBuilder);

  matches       = signal<Match[]>([]);
  loadingMatches= signal(true);
  syncing       = signal(false);
  calculating   = signal(false);
  recalcId      = signal<number | null>(null);
  syncMsg       = signal(''); syncErr = signal(false);
  calcMsg       = signal(''); calcErr = signal(false);
  filter        = '';
  resultOpen    = signal(false);
  selMatch      = signal<Match | null>(null);
  savingResult  = signal(false);

  resultForm = this.fb.group({
    homeScore:  [0, [Validators.required, Validators.min(0)]],
    awayScore:  [0, [Validators.required, Validators.min(0)]],
    calcPoints: [true],
  });

  ngOnInit(): void { this.loadMatches(); }

  private async loadMatches(): Promise<void> {
    this.loadingMatches.set(true);
    this.matches.set(await this.matchService.getAllMatches());
    this.loadingMatches.set(false);
  }

  async syncAll(): Promise<void> {
    this.syncing.set(true); this.syncMsg.set(''); this.syncErr.set(false);
    try {
      const ms = await this.footballApiService.getAllMatches();
      for (const m of ms) await this.matchService.upsertMatch(m);
      this.syncMsg.set(`✅ ${ms.length} partidos sincronizados.`);
      await this.loadMatches();
    } catch (e: any) {
      this.syncErr.set(true);
      this.syncMsg.set(`Error: ${e.message ?? 'No se pudo conectar con la API.'}`);
    } finally { this.syncing.set(false); }
  }

  async syncFinished(): Promise<void> {
    this.calculating.set(true); this.calcMsg.set(''); this.calcErr.set(false);
    try {
      const ms = await this.footballApiService.getMatchesByStatus('FINISHED');
      let count = 0;
      for (const m of ms) {
        if (m.score.fullTime.home !== null && m.score.fullTime.away !== null) {
          await this.matchService.upsertMatch(m);
          await this.predictionService.calculateMatchPredictions(m.id, m.score.fullTime.home!, m.score.fullTime.away!);
          count++;
        }
      }
      this.calcMsg.set(`✅ ${count} partidos procesados.`);
      await this.loadMatches();
    } catch (e: any) {
      this.calcErr.set(true); this.calcMsg.set(`Error: ${e.message}`);
    } finally { this.calculating.set(false); }
  }

  async recalc(m: Match): Promise<void> {
    if (m.score.fullTime.home === null) return;
    this.recalcId.set(m.id);
    await this.predictionService.calculateMatchPredictions(m.id, m.score.fullTime.home!, m.score.fullTime.away!);
    this.recalcId.set(null);
  }

  openResult(m: Match): void {
    this.selMatch.set(m);
    this.resultForm.patchValue({ homeScore: m.score.fullTime.home ?? 0, awayScore: m.score.fullTime.away ?? 0 });
    this.resultOpen.set(true);
  }

  closeResult(): void { this.resultOpen.set(false); this.selMatch.set(null); }

  async saveResult(): Promise<void> {
    const m = this.selMatch();
    if (!m) return;
    this.savingResult.set(true);
    const home = this.resultForm.value.homeScore!;
    const away = this.resultForm.value.awayScore!;
    await this.matchService.updateMatchResult(m.id, home, away);
    if (this.resultForm.value.calcPoints) {
      await this.predictionService.calculateMatchPredictions(m.id, home, away);
    }
    this.closeResult();
    await this.loadMatches();
    this.savingResult.set(false);
  }

  get filteredMatches(): ReturnType<typeof signal<Match[]>> {
    const q = this.filter.trim().toLowerCase();
    if (!q) return this.matches;
    return signal(this.matches().filter(m =>
      m.homeTeam.name.toLowerCase().includes(q) || m.awayTeam.name.toLowerCase().includes(q) ||
      (m.group ?? '').toLowerCase().includes(q)));
  }

  stageLabel(s: string): string { return STAGE_LABELS[s as MatchStage] ?? s; }
  trackId(_: number, m: Match): number { return m.id; }
}
