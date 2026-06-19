import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService }            from '../../core/services/auth.service';
import { MatchService }           from '../../core/services/match.service';
import { PredictionService }      from '../../core/services/prediction.service';
import { LeagueService }          from '../../core/services/league.service';
import { Match, League, PredictionResult } from '../../core/models';
import { TeamFlagComponent }       from '../../shared/components/team-flag/team-flag.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MatchDatePipe }           from '../../shared/pipes/match-date.pipe';

interface FeedRow {
  userId:        string;
  displayName:   string;
  predictedHome: number | null;
  predictedAway: number | null;
  points:        number;
  result:        PredictionResult;
  calculated:    boolean;
  isMe:          boolean;
}

@Component({
  selector:        'app-predictions-feed',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TeamFlagComponent, LoadingSpinnerComponent, MatchDatePipe],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-black text-white flex items-center gap-3">👀 Pronósticos</h1>
        <p class="text-gray-400 text-sm mt-1">
          Mirá qué apostó cada uno. Los pronósticos se revelan cuando arranca el partido.
        </p>
      </div>

      <!-- Selector de liga -->
      <div *ngIf="userLeagues().length > 1" class="mb-4 flex flex-wrap gap-2">
        <button *ngFor="let l of userLeagues()" (click)="selectLeague(l.id)"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          [style.background]="selectedLeagueId()===l.id ? 'linear-gradient(135deg,#7B1F35,#3D0E1C)' : '#1E0E13'"
          [style.color]="selectedLeagueId()===l.id ? '#E2C06A' : '#9ca3af'"
          [style.border]="selectedLeagueId()===l.id ? '1px solid rgba(201,168,67,0.4)' : '1px solid #2A1219'">
          🏆 {{ l.name }}
        </button>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <ng-container *ngIf="!loading()">

        <!-- Sin partidos arrancados -->
        <div *ngIf="startedMatches().length === 0"
             class="text-center py-16 rounded-2xl" style="background:#1E0E13;border:1px solid #2A1219">
          <p class="text-4xl mb-3">⏳</p>
          <p class="text-gray-300 font-semibold">Todavía no arrancó ningún partido.</p>
          <p class="text-gray-500 text-sm mt-2">Cuando empiece el primero vas a poder ver los pronósticos de todos.</p>
        </div>

        <ng-container *ngIf="startedMatches().length > 0">

          <!-- Selector de partido -->
          <div class="mb-5">
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">Elegí un partido</label>
            <div class="relative">
              <select [value]="selectedMatchId()"
                (change)="onSelectMatch($any($event.target).value)"
                class="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-white text-sm font-semibold focus:outline-none"
                style="background:#1E0E13;border:1px solid #2A1219">
                <option *ngFor="let m of startedMatches()" [value]="m.id">
                  {{ m.homeTeam.shortName }} {{ scoreText(m) }} {{ m.awayTeam.shortName }} — {{ m.utcDate | matchDate:'short' }}
                </option>
              </select>
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</span>
            </div>
          </div>

          <!-- Cabecera del partido -->
          <div *ngIf="currentMatch() as m" class="rounded-2xl p-5 mb-4"
               style="background:linear-gradient(135deg,rgba(123,31,53,0.35),rgba(30,14,19,0.9));border:1px solid #2A1219">
            <div class="flex items-center justify-between">
              <div class="flex-1 flex flex-col items-center gap-2">
                <app-team-flag [team]="m.homeTeam" size="md"></app-team-flag>
              </div>
              <div class="flex flex-col items-center px-4">
                <div class="flex items-center gap-2">
                  <span class="text-3xl font-black text-white">{{ m.score.fullTime.home ?? '–' }}</span>
                  <span class="text-gray-600">-</span>
                  <span class="text-3xl font-black text-white">{{ m.score.fullTime.away ?? '–' }}</span>
                </div>
                <span class="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  [style.background]="m.status==='FINISHED' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'"
                  [style.color]="m.status==='FINISHED' ? '#f87171' : '#fbbf24'">
                  {{ m.status==='FINISHED' ? 'Finalizado' : '🔴 En juego' }}
                </span>
              </div>
              <div class="flex-1 flex flex-col items-center gap-2">
                <app-team-flag [team]="m.awayTeam" size="md"></app-team-flag>
              </div>
            </div>
          </div>

          <!-- Lista de pronósticos -->
          <div class="rounded-2xl overflow-hidden" style="background:#1E0E13;border:1px solid #2A1219">
            <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #2A1219">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {{ rows().length }} pronósticos
              </span>
              <span class="text-xs text-gray-500">Pronóstico · Puntos</span>
            </div>

            <div *ngIf="rows().length === 0" class="text-center py-10">
              <p class="text-gray-500 text-sm">Nadie de tu liga apostó en este partido.</p>
            </div>

            <div *ngFor="let r of rows()"
                 class="flex items-center gap-3 px-4 py-3 transition-colors"
                 style="border-bottom:1px solid rgba(42,18,25,0.5)"
                 [style.background]="r.isMe ? 'rgba(201,168,67,0.05)' : 'transparent'">

              <!-- Avatar -->
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                   style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#C9A843">
                {{ r.displayName.charAt(0).toUpperCase() }}
              </div>

              <!-- Nombre -->
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm truncate" [style.color]="r.isMe ? '#C9A843' : '#fff'">
                  {{ r.displayName }}<span *ngIf="r.isMe" class="text-xs ml-1" style="color:#C9A843">(vos)</span>
                </p>
              </div>

              <!-- Pronóstico -->
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="font-black text-white text-base">{{ r.predictedHome }}</span>
                <span class="text-gray-600 text-xs">-</span>
                <span class="font-black text-white text-base">{{ r.predictedAway }}</span>
              </div>

              <!-- Badge resultado / puntos -->
              <div class="w-16 text-right shrink-0">
                <span *ngIf="r.calculated"
                  class="inline-block px-2 py-1 rounded-lg text-xs font-black"
                  [style.background]="badgeBg(r.result)"
                  [style.color]="badgeColor(r.result)">
                  {{ r.points > 0 ? '+' + r.points : '0' }}
                </span>
                <span *ngIf="!r.calculated" class="text-xs text-gray-500">⏳</span>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-600 text-center mt-4">
            Solo se muestran los miembros de tu liga.
          </p>

        </ng-container>
      </ng-container>
    </div>
  `,
})
export class PredictionsFeedComponent implements OnInit {
  private auth          = inject(AuthService);
  private matchService  = inject(MatchService);
  private predService   = inject(PredictionService);
  private leagueService = inject(LeagueService);
  private cdr           = inject(ChangeDetectorRef);

  loading          = signal(true);
  userLeagues      = signal<League[]>([]);
  selectedLeagueId = signal('');
  startedMatches   = signal<Match[]>([]);
  selectedMatchId  = signal<number>(0);
  rows             = signal<FeedRow[]>([]);

  private members = new Map<string, string>();   // userId → displayName (de la liga)

  currentMatch(): Match | null {
    return this.startedMatches().find(m => m.id === this.selectedMatchId()) ?? null;
  }

  ngOnInit(): void { this.init(); }

  private async init(): Promise<void> {
    this.loading.set(true);
    try {
      // Esperar perfil
      for (let i = 0; i < 25 && !this.auth.userProfile(); i++) await new Promise(r => setTimeout(r, 200));

      const leagueIds = this.auth.userProfile()?.leagues ?? [];
      if (leagueIds.length === 0) { this.loading.set(false); this.cdr.markForCheck(); return; }

      const leagues = await this.leagueService.getUserLeagues(leagueIds);
      this.userLeagues.set(leagues);
      const def = leagues.find(l => l.isDefault) ?? leagues[0];
      this.selectedLeagueId.set(def?.id ?? '');

      // Partidos ya arrancados (apuestas cerradas), más recientes primero
      const all = await this.matchService.getAllMatches();
      const started = all
        .filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'FINISHED')
        .sort((a, b) => b.utcDate.getTime() - a.utcDate.getTime());
      this.startedMatches.set(started);

      if (started.length > 0) {
        this.selectedMatchId.set(started[0].id);
        await this.loadLeagueMembers();
        await this.loadPredictions();
      }
    } catch (e) {
      console.error('Error cargando pronósticos:', e);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  private async loadLeagueMembers(): Promise<void> {
    this.members.clear();
    const ranking = await this.leagueService.getRankingByLeague(this.selectedLeagueId());
    ranking.forEach(e => this.members.set(e.userId, e.displayName));
  }

  async selectLeague(leagueId: string): Promise<void> {
    this.selectedLeagueId.set(leagueId);
    this.loading.set(true); this.cdr.markForCheck();
    await this.loadLeagueMembers();
    await this.loadPredictions();
    this.loading.set(false); this.cdr.markForCheck();
  }

  async onSelectMatch(id: string): Promise<void> {
    this.selectedMatchId.set(Number(id));
    await this.loadPredictions();
  }

  private async loadPredictions(): Promise<void> {
    const matchId = this.selectedMatchId();
    const myId    = this.auth.currentUser()?.uid ?? '';
    const preds   = await this.predService.getPredictionsByMatch(matchId);

    const rows: FeedRow[] = preds
      .filter(p => this.members.has(p.userId))   // solo miembros de la liga
      .map(p => ({
        userId:        p.userId,
        displayName:   this.members.get(p.userId) ?? 'Usuario',
        predictedHome: p.predictedHome,
        predictedAway: p.predictedAway,
        points:        p.points,
        result:        p.result,
        calculated:    p.calculated,
        isMe:          p.userId === myId,
      }))
      // Ordenar: más puntos primero, luego los míos arriba si empatan
      .sort((a, b) => (b.points - a.points) || (a.isMe ? -1 : b.isMe ? 1 : 0));

    this.rows.set(rows);
    this.cdr.markForCheck();
  }

  scoreText(m: Match): string {
    if (m.score.fullTime.home == null) return 'vs';
    return `${m.score.fullTime.home}-${m.score.fullTime.away}`;
  }

  badgeBg(r: PredictionResult): string {
    return r === 'EXACT'     ? 'rgba(201,168,67,0.2)'  :
           r === 'GOAL_DIFF' ? 'rgba(59,130,246,0.15)' :
           r === 'TENDENCY'  ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)';
  }
  badgeColor(r: PredictionResult): string {
    return r === 'EXACT'     ? '#C9A843' :
           r === 'GOAL_DIFF' ? '#60a5fa' :
           r === 'TENDENCY'  ? '#fbbf24' : '#9ca3af';
  }
}
