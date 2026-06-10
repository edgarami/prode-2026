import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Firestore, doc, setDoc, getDocs, collection, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { MatchService }        from '../../core/services/match.service';
import { FootballApiService }  from '../../core/services/football-api.service';
import { PredictionService }   from '../../core/services/prediction.service';
import { LeagueService }       from '../../core/services/league.service';
import { AuthService }         from '../../core/services/auth.service';
import { environment }         from '../../../environments/environment';
import { Match, STAGE_LABELS, MatchStage, League } from '../../core/models';
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
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div class="rounded-2xl p-5" style="background:#1E0E13;border:1px solid #2A1219">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">🔄</span> Sincronizar desde API</h3>
          <p class="text-gray-400 text-xs mb-4">Importa todos los partidos desde football-data.org.</p>
          <button (click)="syncAll()" [disabled]="syncing()"
            class="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            {{ syncing() ? 'Sincronizando...' : 'Sincronizar partidos' }}
          </button>
          <p *ngIf="syncMsg()" class="mt-2 text-xs" [style.color]="syncErr() ? '#f87171' : '#C9A843'">{{ syncMsg() }}</p>
        </div>

        <div class="rounded-2xl p-5" style="background:#1E0E13;border:1px solid #2A1219">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">🏆</span> Actualizar resultados</h3>
          <p class="text-gray-400 text-xs mb-4">Trae resultados finalizados y recalcula puntos.</p>
          <button (click)="syncFinished()" [disabled]="calculating()"
            class="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style="border:1px solid #2A1219">
            {{ calculating() ? 'Procesando...' : 'Actualizar y calcular' }}
          </button>
          <p *ngIf="calcMsg()" class="mt-2 text-xs" [style.color]="calcErr() ? '#f87171' : '#C9A843'">{{ calcMsg() }}</p>
        </div>

        <div class="rounded-2xl p-5" style="background:#1E0E13;border:1px solid #2A1219">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">📊</span> Sincronizar Tabla</h3>
          <p class="text-gray-400 text-xs mb-4">Actualiza las posiciones de los grupos desde la API.</p>
          <button (click)="syncStandings()" [disabled]="syncingStandings()"
            class="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style="border:1px solid #2A1219">
            {{ syncingStandings() ? 'Sincronizando...' : 'Sync tabla de grupos' }}
          </button>
          <p *ngIf="standingsMsg()" class="mt-2 text-xs" [style.color]="standingsErr() ? '#f87171' : '#C9A843'">{{ standingsMsg() }}</p>
        </div>

        <div class="rounded-2xl p-5" style="background:#1E0E13;border:1px solid #2A1219">
          <h3 class="font-bold text-white mb-2 flex items-center gap-2"><span class="text-xl">📈</span> Estadísticas</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Total partidos</span>
              <span class="font-bold text-white">{{ matches().length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Finalizados</span>
              <span class="font-bold" style="color:#C9A843">{{ matches() | finishedCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Pendientes</span>
              <span class="font-bold text-amber-400">{{ matches().length - (matches() | finishedCount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ LIGAS ═══ -->
      <div class="mb-8 rounded-2xl p-6" style="background:#1E0E13;border:1px solid #2A1219">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-black text-white flex items-center gap-2">🏆 Ligas privadas</h2>
          <button (click)="showCreateLeague.set(!showCreateLeague())"
            class="py-2 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-80"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            + Nueva liga
          </button>
        </div>

        <!-- Formulario crear liga -->
        <div *ngIf="showCreateLeague()" class="mb-5 p-4 rounded-xl" style="background:#150A0D;border:1px solid #2A1219">
          <p class="text-sm font-bold text-white mb-3">Crear nueva liga</p>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="newLeagueName" placeholder="Nombre de la liga"
              class="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none"
              style="background:#1E0E13;border:1px solid #2A1219"/>
            <button (click)="createLeague()" [disabled]="creatingLeague() || !newLeagueName.trim()"
              class="py-2.5 px-4 rounded-xl text-sm font-bold disabled:opacity-40"
              style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#fff;border:1px solid rgba(123,31,53,0.5)">
              {{ creatingLeague() ? '...' : 'Crear' }}
            </button>
          </div>
          <p *ngIf="createLeagueMsg()" class="mt-2 text-xs" [style.color]="createLeagueErr() ? '#f87171' : '#4ade80'">
            {{ createLeagueMsg() }}
          </p>
        </div>

        <!-- Lista de ligas -->
        <div *ngIf="leagues().length > 0" class="space-y-3">
          <div *ngFor="let l of leagues()" class="flex items-center gap-4 p-4 rounded-xl"
               style="background:#150A0D;border:1px solid #2A1219">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-bold text-white text-sm">{{ l.name }}</p>
                <span *ngIf="l.isDefault" class="text-xs px-2 py-0.5 rounded-full"
                      style="background:rgba(123,31,53,0.3);color:#E2C06A">default</span>
              </div>
              <p class="text-xs text-gray-500">{{ l.memberCount }} participantes</p>
            </div>
            <!-- Código copiable -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="px-3 py-1.5 rounded-lg font-black tracking-widest text-sm cursor-pointer"
                   style="background:#1E0E13;border:1px solid rgba(201,168,67,0.3);color:#C9A843"
                   (click)="copyCode(l.code)" [title]="'Click para copiar'">
                {{ l.code }}
              </div>
              <button (click)="copyCode(l.code)"
                class="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg"
                style="border:1px solid #2A1219" [title]="copiedCode()===l.code ? '¡Copiado!' : 'Copiar código'">
                {{ copiedCode()===l.code ? '✓' : '📋' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="leagues().length === 0 && !loadingLeagues()" class="text-center py-6">
          <p class="text-gray-500 text-sm">No hay ligas creadas aún.</p>
          <p class="text-gray-600 text-xs mt-1 mb-4">Primero creá la liga general por defecto.</p>
          <button (click)="createDefaultLeague()"
            class="py-2.5 px-5 rounded-xl text-sm font-bold hover:opacity-80 transition-all"
            style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#E2C06A;border:1px solid rgba(123,31,53,0.5)">
            🏆 Crear liga "Mano tengo fe"
          </button>
        </div>

        <!-- Migrar usuarios existentes -->
        <div *ngIf="leagues().length > 0" class="mt-4 pt-4" style="border-top:1px solid #2A1219">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-white">Migrar usuarios existentes</p>
              <p class="text-xs text-gray-500 mt-0.5">Agrega la liga default a todos los usuarios que aún no pertenecen a ninguna liga.</p>
            </div>
            <button (click)="migrateUsers()" [disabled]="migrating()"
              class="shrink-0 py-2.5 px-4 rounded-xl text-sm font-bold disabled:opacity-40 transition-all hover:opacity-80"
              style="background:rgba(201,168,67,0.15);color:#C9A843;border:1px solid rgba(201,168,67,0.3)">
              {{ migrating() ? 'Migrando...' : '⚡ Migrar todos' }}
            </button>
          </div>
          <p *ngIf="migrateMsg()" class="mt-2 text-xs" [style.color]="migrateErr() ? '#f87171' : '#4ade80'">
            {{ migrateMsg() }}
          </p>
        </div>

        <app-loading-spinner *ngIf="loadingLeagues()"></app-loading-spinner>
      </div>

      <!-- Lista partidos -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-black text-white">Gestión de Partidos</h2>
          <input type="text" placeholder="Filtrar..." [(ngModel)]="filter"
            class="w-48 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none"
            style="background:#2A1219;border:1px solid #2A1219"/>
        </div>

        <app-loading-spinner *ngIf="loadingMatches()"></app-loading-spinner>

        <div *ngIf="!loadingMatches()" class="space-y-3">
          <div *ngFor="let m of filteredMatches(); trackBy: trackId"
            class="rounded-2xl p-4" style="background:#1E0E13;border:1px solid #2A1219">
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
                [style.background]="m.status==='FINISHED' ? 'rgba(201,168,67,0.15)' :
                                    m.status==='IN_PLAY'   ? 'rgba(245,158,11,0.15)' :
                                    'rgba(59,130,246,0.15)'"
                [style.color]="m.status==='FINISHED' ? '#C9A843' :
                               m.status==='IN_PLAY'   ? '#fbbf24' : '#60a5fa'">
                {{ m.status }}
              </span>

              <div class="flex gap-2 shrink-0">
                <button *ngIf="m.status!=='FINISHED'" (click)="openResult(m)"
                  class="py-1.5 px-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                  style="border:1px solid #2A1219">
                  ✏️ Resultado
                </button>
                <button *ngIf="m.status==='FINISHED'" (click)="recalc(m)"
                  [disabled]="recalcId()===m.id"
                  class="py-1.5 px-3 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
                  style="color:#C9A843">
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
      <div class="relative w-full max-w-sm rounded-2xl p-6" style="background:#1E0E13;border:1px solid #2A1219"
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
              style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
              {{ savingResult() ? 'Guardando...' : 'Confirmar' }}
            </button>
            <button type="button" (click)="closeResult()"
              class="py-2.5 px-4 rounded-xl text-sm text-gray-400 hover:text-white" style="border:1px solid #2A1219">
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
  private leagueService      = inject(LeagueService);
  private authService        = inject(AuthService);
  private fb                 = inject(FormBuilder);
  private http               = inject(HttpClient);
  private firestore          = inject(Firestore);

  matches          = signal<Match[]>([]);
  loadingMatches   = signal(true);
  syncing          = signal(false);
  calculating      = signal(false);
  syncingStandings = signal(false);
  recalcId         = signal<number | null>(null);
  syncMsg          = signal(''); syncErr          = signal(false);
  calcMsg          = signal(''); calcErr          = signal(false);
  standingsMsg     = signal(''); standingsErr     = signal(false);
  filter           = '';
  resultOpen       = signal(false);
  selMatch         = signal<Match | null>(null);
  savingResult     = signal(false);

  // Ligas
  leagues          = signal<League[]>([]);
  loadingLeagues   = signal(true);
  showCreateLeague = signal(false);
  newLeagueName    = '';
  creatingLeague   = signal(false);
  createLeagueMsg  = signal('');
  createLeagueErr  = signal(false);
  copiedCode       = signal('');
  migrating        = signal(false);
  migrateMsg       = signal('');
  migrateErr       = signal(false);

  resultForm = this.fb.group({
    homeScore:  [0, [Validators.required, Validators.min(0)]],
    awayScore:  [0, [Validators.required, Validators.min(0)]],
    calcPoints: [true],
  });

  ngOnInit(): void {
    this.loadMatches();
    this.loadLeagues();
  }

  private async loadLeagues(): Promise<void> {
    this.loadingLeagues.set(true);
    try {
      const leagues = await this.leagueService.getLeagues();
      // Ordenar: default primero, luego por nombre
      leagues.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });
      this.leagues.set(leagues);
    } finally {
      this.loadingLeagues.set(false);
    }
  }

  async createLeague(): Promise<void> {
    const name = this.newLeagueName.trim();
    if (!name) return;
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;

    this.creatingLeague.set(true);
    this.createLeagueMsg.set('');
    this.createLeagueErr.set(false);
    try {
      const league = await this.leagueService.createLeague(name, uid, false);
      this.createLeagueMsg.set(`✅ Liga "${league.name}" creada. Código: ${league.code}`);
      this.newLeagueName = '';
      await this.loadLeagues();
    } catch (e: any) {
      this.createLeagueErr.set(true);
      this.createLeagueMsg.set(`Error: ${e.message}`);
    } finally {
      this.creatingLeague.set(false);
    }
  }

  async createDefaultLeague(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    const existing = await this.leagueService.getDefaultLeague();
    if (existing) {
      alert(`La liga default ya existe: ${existing.name} (${existing.code})`);
      return;
    }
    await this.leagueService.createLeague('Mano tengo fe', uid, true);
    await this.loadLeagues();
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(''), 2000);
    });
  }

  async migrateUsers(): Promise<void> {
    this.migrating.set(true);
    this.migrateMsg.set('');
    this.migrateErr.set(false);
    try {
      const defaultLeague = await this.leagueService.getDefaultLeague();
      if (!defaultLeague) {
        this.migrateErr.set(true);
        this.migrateMsg.set('No existe la liga default. Creala primero.');
        return;
      }

      // Traer todos los usuarios
      const snap = await getDocs(collection(this.firestore, 'users'));
      let migrated = 0;
      let skipped  = 0;

      for (const d of snap.docs) {
        const leagues: string[] = d.data()['leagues'] ?? [];
        if (!leagues.includes(defaultLeague.id)) {
          // Agregar la liga default al usuario
          await updateDoc(doc(this.firestore, 'users', d.id), {
            leagues: arrayUnion(defaultLeague.id),
          });
          migrated++;
        } else {
          skipped++;
        }
      }

      // Actualizar memberCount de la liga
      const leagueRef = doc(this.firestore, 'leagues', defaultLeague.id);
      await updateDoc(leagueRef, { memberCount: snap.size });

      this.migrateMsg.set(
        `✅ ${migrated} usuario${migrated !== 1 ? 's' : ''} migrado${migrated !== 1 ? 's' : ''}` +
        (skipped > 0 ? ` · ${skipped} ya pertenecían` : '')
      );
      await this.loadLeagues();
    } catch (e: any) {
      this.migrateErr.set(true);
      this.migrateMsg.set(`Error: ${e.message}`);
    } finally {
      this.migrating.set(false);
    }
  }

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

  private apiBase(path: string): string {
    const isLocal = window.location.hostname === 'localhost';
    return isLocal
      ? `/api/football/v4/competitions/${environment.competitionCode}${path}`
      : `${environment.footballApiUrl}/competitions/${environment.competitionCode}${path}`;
  }

  async syncStandings(): Promise<void> {
    this.syncingStandings.set(true);
    this.standingsMsg.set(''); this.standingsErr.set(false);
    try {
      const headers = new HttpHeaders({ 'X-Auth-Token': environment.footballApiKey });
      const res = await firstValueFrom(
        this.http.get<any>(this.apiBase('/standings'), { headers })
      );
      const groups = (res.standings ?? [])
        .filter((s: any) => s.group && s.type === 'TOTAL');
      // Guardar en Firestore como un único documento
      await setDoc(doc(this.firestore, 'standings', 'groups'), {
        groups,
        updatedAt: new Date().toISOString(),
      });
      this.standingsMsg.set(`✅ ${groups.length} grupos sincronizados.`);
    } catch (e: any) {
      this.standingsErr.set(true);
      this.standingsMsg.set(`Error: ${e.message}`);
    } finally { this.syncingStandings.set(false); }
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
