import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface StandingRow {
  position:       number;
  team:           { id: number; name: string; shortName: string; tla: string; crest: string };
  playedGames:    number;
  won:            number;
  draw:           number;
  lost:           number;
  points:         number;
  goalsFor:       number;
  goalsAgainst:   number;
  goalDifference: number;
  form:           string | null;
}

interface Group {
  group: string;
  table: StandingRow[];
}

@Component({
  selector:        'app-standings',
  standalone:      true,
  imports:         [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-white flex items-center gap-3">
          <span>🏆</span> Tabla de Posiciones
        </h1>
        <p class="text-gray-400 text-sm mt-1">
          FIFA World Cup 2026 · Fase de Grupos
        </p>
      </div>

      <!-- Filtro de grupos -->
      <div *ngIf="!loading() && groups().length > 0" class="mb-6">
        <div class="flex flex-wrap gap-2">
          <button (click)="selectedGroup.set('all')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            [style.background]="selectedGroup()==='all' ? 'linear-gradient(135deg,#C9A843,#A8872E)' : '#1E0E13'"
            [style.color]="selectedGroup()==='all' ? '#0E0608' : '#9ca3af'"
            [style.border]="selectedGroup()==='all' ? 'none' : '1px solid #2A1219'">
            Todos
          </button>
          <button *ngFor="let g of groups()" (click)="selectedGroup.set(g.group)"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            [style.background]="selectedGroup()===g.group ? 'linear-gradient(135deg,#C9A843,#A8872E)' : '#1E0E13'"
            [style.color]="selectedGroup()===g.group ? '#0E0608' : '#9ca3af'"
            [style.border]="selectedGroup()===g.group ? 'none' : '1px solid #2A1219'">
            {{ g.group.replace('Group ', '') }}
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <ng-container *ngIf="loading()">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div *ngFor="let s of [1,2,3,4,5,6]" class="rounded-2xl p-4" style="background:#1E0E13;border:1px solid #2A1219">
            <div class="h-4 rounded w-24 mb-4 skeleton"></div>
            <div *ngFor="let r of [1,2,3,4]" class="flex items-center gap-3 py-2">
              <div class="w-5 h-5 rounded skeleton shrink-0"></div>
              <div class="w-6 h-6 rounded-full skeleton shrink-0"></div>
              <div class="flex-1 h-3 rounded skeleton"></div>
              <div class="w-6 h-3 rounded skeleton"></div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Error -->
      <div *ngIf="!loading() && error()" class="text-center py-16">
        <p class="text-4xl mb-3">😕</p>
        <p class="text-gray-300 font-semibold">No se pudo cargar la tabla de posiciones.</p>
        <p class="text-gray-500 text-sm mt-1 mb-5">{{ error() }}</p>
        <button (click)="load()"
          class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
          Reintentar
        </button>
      </div>

      <!-- Grupos -->
      <div *ngIf="!loading() && !error()"
           class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        <div *ngFor="let g of filteredGroups()"
             class="rounded-2xl overflow-hidden"
             style="background:#1E0E13;border:1px solid #2A1219">

          <!-- Cabecera del grupo -->
          <div class="px-4 py-3 flex items-center justify-between"
               style="background:linear-gradient(135deg,rgba(123,31,53,0.5),rgba(61,14,28,0.3));border-bottom:1px solid #2A1219">
            <h3 class="font-black text-white text-sm tracking-wider">{{ g.group }}</h3>
            <div class="flex gap-3 text-xs font-semibold text-gray-400">
              <span class="w-5 text-center" title="Partidos jugados">PJ</span>
              <span class="w-5 text-center" title="Ganados">G</span>
              <span class="w-5 text-center" title="Empatados">E</span>
              <span class="w-5 text-center" title="Perdidos">P</span>
              <span class="w-8 text-center" title="Diferencia de goles">DG</span>
              <span class="w-6 text-center" style="color:#C9A843" title="Puntos">Pts</span>
            </div>
          </div>

          <!-- Filas de equipos -->
          <div>
            <div *ngFor="let row of g.table; let i = index"
                 class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-opacity-50"
                 [style.background]="i < 2 ? 'rgba(201,168,67,0.05)' : i === 2 ? 'rgba(201,168,67,0.02)' : 'transparent'"
                 [style.border-bottom]="i < g.table.length - 1 ? '1px solid rgba(42,18,25,0.6)' : 'none'">

              <!-- Posición con indicador de clasificación -->
              <div class="w-5 flex items-center justify-center shrink-0">
                <span class="text-xs font-black"
                  [style.color]="i === 0 ? '#C9A843' : i === 1 ? '#9ca3af' : i === 2 ? 'rgba(201,168,67,0.5)' : '#4b5563'">
                  {{ row.position }}
                </span>
              </div>

              <!-- Indicador visual clasificación -->
              <div class="w-1 h-6 rounded-full shrink-0"
                   [style.background]="i === 0 ? '#C9A843' : i === 1 ? 'rgba(201,168,67,0.5)' : i === 2 ? 'rgba(201,168,67,0.2)' : 'transparent'">
              </div>

              <!-- Escudo -->
              <img [src]="row.team.crest" [alt]="row.team.shortName"
                   class="w-6 h-6 object-contain shrink-0"
                   onerror="this.style.display='none'"/>

              <!-- Nombre equipo -->
              <span class="flex-1 text-sm font-semibold truncate"
                    [style.color]="i < 2 ? '#fff' : i === 2 ? '#d1d5db' : '#6b7280'">
                {{ row.team.shortName }}
              </span>

              <!-- Stats -->
              <div class="flex gap-3 text-xs text-gray-400 shrink-0">
                <span class="w-5 text-center">{{ row.playedGames }}</span>
                <span class="w-5 text-center">{{ row.won }}</span>
                <span class="w-5 text-center">{{ row.draw }}</span>
                <span class="w-5 text-center">{{ row.lost }}</span>
                <span class="w-8 text-center"
                      [style.color]="row.goalDifference > 0 ? '#4ade80' : row.goalDifference < 0 ? '#f87171' : '#9ca3af'">
                  {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                </span>
                <span class="w-6 text-center font-black" style="color:#C9A843">{{ row.points }}</span>
              </div>
            </div>
          </div>

          <!-- Footer del grupo: leyenda clasificación -->
          <div class="px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1"
               style="border-top:1px solid #2A1219;background:rgba(14,6,8,0.4)">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full" style="background:#C9A843"></div>
              <span class="text-xs text-gray-500">Clasifican (Ronda de 32)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full" style="background:rgba(201,168,67,0.35)"></div>
              <span class="text-xs text-gray-500">Posible 3° clasificado</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Info formato Mundial 2026 -->
      <div *ngIf="!loading() && !error() && groups().length > 0"
           class="mt-6 rounded-2xl p-4 sm:p-5" style="background:#1E0E13;border:1px solid #2A1219">
        <h3 class="font-black text-white text-sm mb-3 flex items-center gap-2">
          📋 Formato Mundial 2026
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black"
                 style="background:rgba(201,168,67,0.15);color:#C9A843">1°</div>
            <div>
              <p class="font-bold text-white">1° y 2° de cada grupo</p>
              <p class="text-gray-400 mt-0.5">24 equipos clasifican directamente a la Ronda de 32.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs"
                 style="background:rgba(201,168,67,0.08);color:rgba(201,168,67,0.6)">3°</div>
            <div>
              <p class="font-bold text-white">8 mejores terceros</p>
              <p class="text-gray-400 mt-0.5">Los 8 terceros con más puntos entre los 12 grupos también clasifican.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black"
                 style="background:rgba(123,31,53,0.3);color:#9B2D47">32</div>
            <div>
              <p class="font-bold text-white">Ronda de 32</p>
              <p class="text-gray-400 mt-0.5">Nueva fase del torneo. 32 → 16 → 8 → 4 → Final.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Leyenda -->
      <div *ngIf="!loading() && !error() && groups().length > 0"
           class="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span><span class="font-bold text-gray-400">PJ</span> = Partidos jugados</span>
        <span><span class="font-bold text-gray-400">G</span> = Ganados</span>
        <span><span class="font-bold text-gray-400">E</span> = Empatados</span>
        <span><span class="font-bold text-gray-400">P</span> = Perdidos</span>
        <span><span class="font-bold text-gray-400">DG</span> = Diferencia de goles</span>
        <span><span class="font-bold" style="color:#C9A843">Pts</span> = Puntos</span>
      </div>

    </div>
  `,
})
export class StandingsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  groups        = signal<Group[]>([]);
  loading       = signal(true);
  error         = signal('');
  selectedGroup = signal('all');

  private get base(): string {
    return environment.production
      ? `${environment.footballApiUrl}/competitions/${environment.competitionCode}`
      : `/api/football/v4/competitions/${environment.competitionCode}`;
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Auth-Token': environment.footballApiKey });
  }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.base}/standings`, { headers: this.headers })
      );
      // Filtrar solo grupos (excluir TOTAL/ALL que es el acumulado)
      const groups: Group[] = (res.standings ?? [])
        .filter((s: any) => s.group && s.group !== 'null' && s.type === 'TOTAL')
        .map((s: any) => ({
          group: s.group,
          table: s.table ?? [],
        }))
        .sort((a: Group, b: Group) => a.group.localeCompare(b.group));
      this.groups.set(groups);
    } catch (e: any) {
      this.error.set(e.message ?? 'Error al cargar los datos.');
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  filteredGroups(): Group[] {
    const sel = this.selectedGroup();
    if (sel === 'all') return this.groups();
    return this.groups().filter(g => g.group === sel);
  }
}
