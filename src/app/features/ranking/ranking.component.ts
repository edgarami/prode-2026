import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RankingService }          from '../../core/services/ranking.service';
import { AuthService }             from '../../core/services/auth.service';
import { RankingEntry }            from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector:        'app-ranking',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-black text-white">Ranking del Torneo</h1>
          <p class="text-gray-400 text-sm mt-1">Los mejores predictores ganan premios exclusivos.</p>
        </div>
        <button (click)="scrollToMe()"
          class="self-start sm:self-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-300 flex items-center gap-2 hover:text-white transition-colors"
          style="border:1px solid #2A1219">
          📍 Mi posición
        </button>
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
                <tr *ngFor="let e of filtered(); trackBy: track"
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
              </ng-container>
            </tbody>
          </table>
        </div>
        <div *ngIf="!loading() && hasMore()" class="p-4" style="border-top:1px solid #2A1219">
          <button (click)="loadMore()" [disabled]="loadingMore()"
            class="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            style="border:1px solid #2A1219">
            {{ loadingMore() ? 'Cargando...' : 'Cargar más' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class RankingComponent implements OnInit {
  private rankingService = inject(RankingService);
  private authService    = inject(AuthService);

  loading     = signal(true);
  loadingMore = signal(false);
  hasMore     = signal(false);
  entries     = signal<RankingEntry[]>([]);
  top3        = signal<RankingEntry[]>([]);
  myId        = signal('');
  searchQuery = '';

  private offset = 0;

  ngOnInit(): void {
    this.myId.set(this.authService.currentUser()?.uid ?? '');
    this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [t3, page] = await Promise.all([
        this.rankingService.getTopThree(),
        this.rankingService.getRanking(20),
      ]);
      this.top3.set(t3);
      this.entries.set(page.entries.map((e, i) => ({ ...e, rank: i + 1 })));
      this.offset = page.entries.length;
      this.hasMore.set(page.entries.length === 20);
    } catch (e) {
      console.error('Error cargando ranking:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    this.loadingMore.set(true);
    try {
      const page = await this.rankingService.getRanking(this.offset + 20);
      const all  = page.entries.map((e, i) => ({ ...e, rank: i + 1 }));
      this.entries.set(all);
      this.offset = all.length;
      this.hasMore.set(page.entries.length % 20 === 0 && page.entries.length > this.offset - 20);
    } catch (e) {
      console.error('Error cargando más:', e);
    } finally {
      this.loadingMore.set(false);
    }
  }

  get filtered(): ReturnType<typeof signal<RankingEntry[]>> {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.entries;
    return signal(this.entries().filter(e => e.displayName.toLowerCase().includes(q)));
  }

  scrollToMe(): void {
    document.getElementById(`u-${this.myId()}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  track(_: number, e: RankingEntry): string { return e.userId; }
}
