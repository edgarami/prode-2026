import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RankingService }          from '../../core/services/ranking.service';
import { AuthService }             from '../../core/services/auth.service';
import { LeagueService }           from '../../core/services/league.service';
import { RankingEntry, League }    from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector:        'app-ranking',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <img src="assets/copa-mundial-sin-fondo.png" alt="Copa"
               class="w-14 h-14 object-contain shrink-0"
               style="filter:drop-shadow(0 0 12px rgba(201,168,67,0.5))"/>
          <div>
            <h1 class="text-3xl font-black text-white">Ranking</h1>
            <p class="text-gray-400 text-sm mt-1">Los mejores predictores del torneo.</p>
          </div>
        </div>
        <button (click)="scrollToMe()"
          class="self-start sm:self-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-300 flex items-center gap-2 hover:text-white transition-colors"
          style="border:1px solid #2A1219">
          📍 Mi posición
        </button>
      </div>

      <!-- Selector de liga -->
      <div *ngIf="userLeagues().length > 0" class="mb-6 flex flex-wrap gap-2">
        <button *ngFor="let l of userLeagues()" (click)="selectLeague(l.id)"
          class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
          [style.background]="selectedLeagueId()===l.id ? 'linear-gradient(135deg,#7B1F35,#3D0E1C)' : '#1E0E13'"
          [style.color]="selectedLeagueId()===l.id ? '#E2C06A' : '#9ca3af'"
          [style.border]="selectedLeagueId()===l.id ? '1px solid rgba(201,168,67,0.4)' : '1px solid #2A1219'">
          🏆 {{ l.name }}
          <span *ngIf="l.isDefault" class="ml-1 text-xs opacity-60">(general)</span>
        </button>
      </div>

      <!-- Acceso a pronósticos -->
      <a routerLink="/pronosticos"
         class="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-90"
         style="background:linear-gradient(135deg,rgba(123,31,53,0.3),rgba(30,14,19,0.6));border:1px solid rgba(201,168,67,0.25)">
        <span class="text-xl">👀</span>
        <div class="flex-1">
          <p class="text-white font-bold text-sm">Ver pronósticos de todos</p>
          <p class="text-gray-400 text-xs">Mirá qué apostó cada uno en los partidos que ya arrancaron.</p>
        </div>
        <span style="color:#C9A843" class="text-sm font-bold">→</span>
      </a>

      <!-- Liga activa badge -->
      <div *ngIf="activeLeague()" class="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl"
           style="background:rgba(123,31,53,0.2);border:1px solid rgba(123,31,53,0.3)">
        <span class="text-lg">🏆</span>
        <div>
          <p class="text-white font-bold text-sm">{{ activeLeague()!.name }}</p>
          <p class="text-gray-400 text-xs">{{ entries().length }} participantes · Solo ves a los de tu liga</p>
        </div>
      </div>

      <!-- Podio Top 3 -->
      <div *ngIf="top3().length === 3" class="grid grid-cols-3 gap-3 mb-8">
        <!-- 2do -->
        <div class="rounded-2xl p-4 flex flex-col items-center text-center mt-6" style="background:#1E0E13;border:1px solid #2A1219">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black mb-2" style="background:#2A1219;color:#9ca3af">
            {{ top3()[1].displayName.charAt(0) }}
          </div>
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white mb-2" style="background:#6b7280">2</div>
          <p class="font-bold text-white text-sm truncate w-full text-center">{{ top3()[1].displayName }}</p>
          <p class="text-xl font-black text-white mt-1">{{ top3()[1].totalPoints | number }}</p>
          <p class="text-xs text-gray-400">pts</p>
        </div>
        <!-- 1ro -->
        <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#1E0E13;border:1px solid rgba(201,168,67,0.3)">
          <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black mb-2 border-2" style="background:#2A1219;color:#f59e0b;border-color:#f59e0b">
            {{ top3()[0].displayName.charAt(0) }}
          </div>
          <div class="text-2xl mb-2">🏆</div>
          <p class="font-bold text-white truncate w-full text-center">{{ top3()[0].displayName }}</p>
          <p class="text-3xl font-black mt-1" style="color:#C9A843">{{ top3()[0].totalPoints | number }}</p>
          <p class="text-xs text-gray-400">pts</p>
        </div>
        <!-- 3ro -->
        <div class="rounded-2xl p-4 flex flex-col items-center text-center mt-6" style="background:#1E0E13;border:1px solid #2A1219">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black mb-2" style="background:#2A1219;color:#92400e">
            {{ top3()[2].displayName.charAt(0) }}
          </div>
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white mb-2" style="background:#92400e">3</div>
          <p class="font-bold text-white text-sm truncate w-full text-center">{{ top3()[2].displayName }}</p>
          <p class="text-xl font-black text-white mt-1">{{ top3()[2].totalPoints | number }}</p>
          <p class="text-xs text-gray-400">pts</p>
        </div>
      </div>

      <!-- Buscador -->
      <div class="relative mb-4">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" placeholder="Buscar usuario..." [(ngModel)]="searchQuery"
          class="w-full rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none"
          style="background:#2A1219;border:1px solid #2A1219"/>
      </div>

      <!-- Tabla -->
      <div class="rounded-2xl overflow-hidden" style="background:#1E0E13;border:1px solid #2A1219">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr style="border-bottom:1px solid #2A1219">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-12">Pos.</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Usuario</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Exactos</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Tendencias</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Puntos</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading()">
                <td colspan="5" class="py-12 text-center">
                  <app-loading-spinner size="sm" containerClass=""></app-loading-spinner>
                </td>
              </tr>
              <ng-container *ngIf="!loading()">
                <tr *ngFor="let e of filteredEntries(); trackBy: track"
                  [id]="'u-' + e.userId"
                  class="transition-colors"
                  style="border-bottom:1px solid rgba(31,41,64,0.5)"
                  [style.background]="e.userId===myId() ? 'rgba(201,168,67,0.05)' : 'transparent'"
                  [style.border-left]="e.userId===myId() ? '3px solid #C9A843' : '3px solid transparent'">
                  <td class="px-4 py-3">
                    <span class="font-black text-sm"
                      [style.color]="e.rank===1 ? '#f59e0b' : e.rank===2 ? '#9ca3af' : e.rank===3 ? '#92400e' : e.userId===myId() ? '#C9A843' : '#d1d5db'">
                      {{ e.rank }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style="background:#2A1219;color:#9ca3af">
                        {{ e.displayName.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-semibold text-sm" [style.color]="e.userId===myId() ? '#C9A843' : '#fff'">
                          {{ e.displayName }}<span *ngIf="e.userId===myId()" class="text-xs ml-1" style="color:#C9A843">(vos)</span>
                        </p>
                        <p class="text-xs text-gray-500 hidden sm:block">{{ e.country }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center hidden sm:table-cell">
                    <span class="font-semibold text-sm" style="color:#C9A843">{{ e.exactScores }}</span>
                  </td>
                  <td class="px-4 py-3 text-center hidden sm:table-cell">
                    <span class="font-semibold text-sm text-blue-400">{{ e.correctWinners }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="font-black" style="color:#C9A843">{{ e.totalPoints | number }}</span>
                  </td>
                </tr>
                <tr *ngIf="filteredEntries().length === 0">
                  <td colspan="5" class="py-12 text-center">
                    <p class="text-gray-500 text-sm">No hay participantes en esta liga todavía.</p>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sin ligas -->
      <div *ngIf="!loading() && userLeagues().length === 0"
           class="mt-6 rounded-2xl p-6 text-center" style="background:#1E0E13;border:1px solid #2A1219">
        <p class="text-3xl mb-3">🏆</p>
        <p class="text-white font-bold">No estás en ninguna liga</p>
        <p class="text-gray-400 text-sm mt-1">Pedíle un código de invitación al administrador y uníte desde tu perfil.</p>
      </div>

    </div>
  `,
})
export class RankingComponent implements OnInit {
  private rankingService = inject(RankingService);
  private authService    = inject(AuthService);
  private leagueService  = inject(LeagueService);
  private cdr            = inject(ChangeDetectorRef);

  loading          = signal(true);
  entries          = signal<RankingEntry[]>([]);
  top3             = signal<RankingEntry[]>([]);
  myId             = signal('');
  searchQuery      = '';
  userLeagues      = signal<League[]>([]);
  selectedLeagueId = signal('');

  get activeLeague(): ReturnType<typeof signal<League | null>> {
    const id = this.selectedLeagueId();
    return signal(this.userLeagues().find(l => l.id === id) ?? null);
  }

  ngOnInit(): void {
    this.myId.set(this.authService.currentUser()?.uid ?? '');
    this.loadLeagues();
  }

  private async loadLeagues(): Promise<void> {
    const profile = this.authService.userProfile();
    if (!profile) return;

    const leagues = await this.leagueService.getUserLeagues(profile.leagues ?? []);
    this.userLeagues.set(leagues);

    if (leagues.length > 0) {
      // Seleccionar liga default si existe, sino la primera
      const def = leagues.find(l => l.isDefault) ?? leagues[0];
      this.selectedLeagueId.set(def.id);
      await this.loadRanking(def.id);
    } else {
      this.loading.set(false);
    }
    this.cdr.markForCheck();
  }

  async selectLeague(leagueId: string): Promise<void> {
    this.selectedLeagueId.set(leagueId);
    await this.loadRanking(leagueId);
  }

  private async loadRanking(leagueId: string): Promise<void> {
    this.loading.set(true);
    try {
      const entries = await this.leagueService.getRankingByLeague(leagueId);
      this.entries.set(entries);
      this.top3.set(entries.slice(0, 3).filter((_, i) => entries.length >= 3 ? true : false));
    } catch (e) {
      console.error('Error cargando ranking:', e);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  filteredEntries(): RankingEntry[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.entries();
    return this.entries().filter(e => e.displayName.toLowerCase().includes(q));
  }

  scrollToMe(): void {
    document.getElementById(`u-${this.myId()}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  track(_: number, e: RankingEntry): string { return e.userId; }
}
