import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService }        from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService }        from '../../core/services/user.service';
import { PredictionService }  from '../../core/services/prediction.service';
import { MatchService }       from '../../core/services/match.service';
import { LeagueService }      from '../../core/services/league.service';
import { Prediction, Match, STAGE_LABELS, League } from '../../core/models';
import { ScoreBadgeComponent }      from '../../shared/components/score-badge/score-badge.component';
import { TeamFlagComponent }        from '../../shared/components/team-flag/team-flag.component';
import { LoadingSpinnerComponent }  from '../../shared/components/loading-spinner/loading-spinner.component';
import { MatchDatePipe }            from '../../shared/pipes/match-date.pipe';

interface PredWithMatch { prediction: Prediction; match: Match | null; }

@Component({
  selector:        'app-profile',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ScoreBadgeComponent, TeamFlagComponent, LoadingSpinnerComponent, MatchDatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Tarjeta de perfil -->
      <div class="rounded-2xl p-6 mb-8" style="background:#1E0E13;border:1px solid #2A1219">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div class="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shrink-0"
               style="background:#2A1219;border:2px solid rgba(201,168,67,0.3);color:#C9A843">
            {{ userProfile()?.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
          </div>
          <div class="flex-1 text-center sm:text-left">
            <h1 class="text-2xl font-black text-white">{{ userProfile()?.displayName }}</h1>
            <p class="text-gray-400 text-sm">{{ userProfile()?.email }}</p>
            <div class="flex flex-wrap justify-center sm:justify-start gap-5 mt-4">
              <div class="text-center">
                <p class="text-2xl font-black" style="color:#C9A843">{{ userProfile()?.totalPoints ?? 0 }}</p>
                <p class="text-xs text-gray-400">Puntos</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-black text-white">#{{ userProfile()?.rank || '—' }}</p>
                <p class="text-xs text-gray-400">Posición</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-black" style="color:#C9A843">{{ userProfile()?.exactScores ?? 0 }}</p>
                <p class="text-xs text-gray-400">Exactos 🎯</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-black text-white">{{ userProfile()?.correctWinners ?? 0 }}</p>
                <p class="text-xs text-gray-400">Tendencias</p>
              </div>
            </div>
          </div>
          <button (click)="editMode.set(!editMode())"
            class="self-start py-2 px-4 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            style="border:1px solid #2A1219">
            {{ editMode() ? 'Cancelar' : '✏️ Editar perfil' }}
          </button>
        </div>

        <div *ngIf="editMode()" class="mt-6 pt-6" style="border-top:1px solid #2A1219">
          <form [formGroup]="editForm" (ngSubmit)="save()" class="space-y-4 max-w-md">
            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Nombre</label>
              <input type="text" formControlName="displayName"
                class="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                style="background:#2A1219;border:1px solid #2A1219"/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">País</label>
              <input type="text" formControlName="country"
                class="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                style="background:#2A1219;border:1px solid #2A1219"/>
            </div>
            <div class="flex gap-3">
              <button type="submit" [disabled]="saving()"
                class="py-2.5 px-5 rounded-xl font-bold text-sm disabled:opacity-40"
                style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
              <button type="button" (click)="editMode.set(false)"
                class="py-2.5 px-5 rounded-xl text-sm text-gray-400 hover:text-white" style="border:1px solid #2A1219">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══ NOTIFICACIONES ═══ -->
      <div *ngIf="notif.isConfigured()" class="rounded-2xl p-6 mb-8" style="background:#1E0E13;border:1px solid #2A1219">
        <div class="flex items-start gap-4">
          <span class="text-2xl shrink-0">🔔</span>
          <div class="flex-1">
            <h2 class="text-lg font-black text-white">Recordatorios de partidos</h2>
            <p class="text-gray-400 text-sm mt-1">
              Te avisamos al teléfono ~1 hora antes de cada partido que todavía no predijiste.
            </p>

            <!-- No soportado -->
            <p *ngIf="!notif.isSupported()" class="mt-3 text-xs text-amber-400">
              ⚠️ Tu navegador no soporta notificaciones. En iPhone, primero
              <a routerLink="/instalar" class="underline" style="color:#C9A843">instalá la app</a>
              y abrila desde la pantalla de inicio.
            </p>

            <!-- Activadas -->
            <div *ngIf="notif.isSupported() && notif.permission()==='granted'"
                 class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
                 style="background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid rgba(74,222,128,0.25)">
              ✓ Notificaciones activadas
            </div>

            <!-- Bloqueadas -->
            <p *ngIf="notif.isSupported() && notif.permission()==='denied'" class="mt-3 text-xs text-amber-400">
              Tenés las notificaciones bloqueadas. Habilitalas desde los ajustes del navegador para este sitio.
            </p>

            <!-- Activar -->
            <button *ngIf="notif.isSupported() && notif.permission()==='default'"
              (click)="enableNotifs()" [disabled]="enabling()"
              class="mt-3 py-2.5 px-5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
              style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
              {{ enabling() ? 'Activando...' : '🔔 Activar recordatorios' }}
            </button>
            <p *ngIf="notifMsg()" class="mt-2 text-xs" [style.color]="notifErr() ? '#f87171' : '#4ade80'">
              {{ notifMsg() }}
            </p>
          </div>
        </div>
      </div>

      <!-- ═══ MIS LIGAS ═══ -->
      <div class="rounded-2xl p-6 mb-8" style="background:#1E0E13;border:1px solid #2A1219">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-black text-white flex items-center gap-2">
            🏆 Mis Ligas
          </h2>
          <button (click)="showJoinLeague.set(!showJoinLeague())"
            class="py-1.5 px-3 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style="background:linear-gradient(135deg,#C9A843,#A8872E);color:#0E0608">
            + Unirse a liga
          </button>
        </div>

        <!-- Formulario unirse con código -->
        <div *ngIf="showJoinLeague()" class="mb-4 p-4 rounded-xl" style="background:#150A0D;border:1px solid #2A1219">
          <p class="text-sm text-gray-300 font-semibold mb-3">Ingresá el código de invitación</p>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="joinCode" placeholder="Ej: MANO2026"
              (input)="onJoinCodeInput()"
              class="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none uppercase tracking-widest font-bold"
              style="background:#1E0E13;border:1px solid #2A1219"/>
            <button (click)="joinLeague()" [disabled]="joiningLeague() || !joinResolvedLeague()"
              class="py-2.5 px-4 rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
              style="background:linear-gradient(135deg,#7B1F35,#3D0E1C);color:#fff;border:1px solid rgba(123,31,53,0.5)">
              {{ joiningLeague() ? '...' : 'Unirse' }}
            </button>
          </div>
          <div *ngIf="joinResolvedLeague()" class="mt-2 flex items-center gap-2 text-xs" style="color:#C9A843">
            <span>✓</span> <span class="font-semibold">{{ joinResolvedLeague()!.name }}</span>
          </div>
          <p *ngIf="joinCodeInvalid()" class="mt-2 text-xs text-red-400">Código no encontrado.</p>
          <p *ngIf="joinSuccess()" class="mt-2 text-xs text-green-400">✓ Te uniste a la liga correctamente.</p>
          <p *ngIf="alreadyMember()" class="mt-2 text-xs text-yellow-400">Ya sos miembro de esta liga.</p>
        </div>

        <!-- Lista de ligas -->
        <div *ngIf="userLeagues().length > 0" class="space-y-2">
          <div *ngFor="let l of userLeagues()"
               class="flex items-center justify-between px-4 py-3 rounded-xl"
               style="background:#150A0D;border:1px solid #2A1219">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                   [style.background]="l.isDefault ? 'linear-gradient(135deg,rgba(123,31,53,0.4),rgba(61,14,28,0.3))' : 'rgba(201,168,67,0.1)'">
                🏆
              </div>
              <div>
                <p class="font-bold text-white text-sm">{{ l.name }}</p>
                <p class="text-xs text-gray-500">{{ l.memberCount }} participantes</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span *ngIf="l.isDefault" class="text-xs text-gray-500 px-2 py-1 rounded-lg" style="background:#1E0E13">general</span>
              <button *ngIf="!l.isDefault" (click)="leaveLeague(l)"
                class="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg"
                style="border:1px solid #2A1219">
                Salir
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="userLeagues().length === 0 && !loadingLeagues()" class="text-center py-6">
          <p class="text-gray-500 text-sm">Todavía no estás en ninguna liga.</p>
        </div>

        <app-loading-spinner *ngIf="loadingLeagues()"></app-loading-spinner>
      </div>

      <!-- Historial de predicciones -->
      <div>
        <h2 class="text-xl font-black text-white mb-4">Historial de predicciones</h2>

        <div class="flex flex-wrap gap-2 mb-4">
          <button *ngFor="let f of filters" (click)="activeFilter.set(f.v)"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            [style.background]="activeFilter()===f.v ? '#C9A843' : '#2A1219'"
            [style.color]="activeFilter()===f.v ? '#0E0608' : '#9ca3af'">
            {{ f.l }}
          </button>
        </div>

        <app-loading-spinner *ngIf="loadingPreds()"></app-loading-spinner>

        <div *ngIf="!loadingPreds()" class="space-y-3">
          <div *ngFor="let item of filteredPreds(); trackBy: trackById"
            class="rounded-2xl p-4" style="background:#1E0E13;border:1px solid #2A1219">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <app-team-flag *ngIf="item.match" [team]="item.match.homeTeam" size="sm" [showName]="false"></app-team-flag>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-white text-sm truncate">
                    {{ item.match?.homeTeam?.tla ?? '?' }} vs {{ item.match?.awayTeam?.tla ?? '?' }}
                  </p>
                  <p class="text-xs text-gray-500">{{ item.match?.utcDate | matchDate:'short' }}</p>
                </div>
                <app-team-flag *ngIf="item.match" [team]="item.match.awayTeam" size="sm" [showName]="false"></app-team-flag>
              </div>
              <div class="text-center shrink-0">
                <p class="font-black text-white">{{ item.prediction.predictedHome }}-{{ item.prediction.predictedAway }}</p>
                <p class="text-xs text-gray-500">Predicción</p>
              </div>
              <div *ngIf="item.match?.status==='FINISHED'" class="text-center shrink-0">
                <p class="font-bold text-gray-400 text-sm">
                  {{ item.match!.score.fullTime.home }}-{{ item.match!.score.fullTime.away }}
                </p>
                <p class="text-xs text-gray-500">Real</p>
              </div>
              <app-score-badge [result]="item.prediction.result"
                [points]="item.prediction.calculated ? item.prediction.points : undefined">
              </app-score-badge>
            </div>
          </div>
          <div *ngIf="filteredPreds().length===0" class="text-center py-12">
            <p class="text-4xl mb-3">⚽</p>
            <p class="text-gray-400">No hay predicciones en esta categoría.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private auth              = inject(AuthService);
  private userService       = inject(UserService);
  private predictionService = inject(PredictionService);
  private matchService      = inject(MatchService);
  private leagueService     = inject(LeagueService);
  private fb                = inject(FormBuilder);
  private cdr               = inject(ChangeDetectorRef);
  readonly notif            = inject(NotificationService);

  userProfile  = this.auth.userProfile;
  editMode     = signal(false);
  saving       = signal(false);
  loadingPreds = signal(true);
  activeFilter = signal('ALL');
  allItems     = signal<PredWithMatch[]>([]);

  // Notificaciones
  enabling = signal(false);
  notifMsg = signal('');
  notifErr = signal(false);

  // Ligas
  userLeagues      = signal<League[]>([]);
  loadingLeagues   = signal(true);
  showJoinLeague   = signal(false);
  joinCode         = '';
  joinResolvedLeague = signal<League | null>(null);
  joinCodeInvalid  = signal(false);
  joiningLeague    = signal(false);
  joinSuccess      = signal(false);
  alreadyMember    = signal(false);
  private joinTimer: any = null;

  filters = [
    {l:'Todas', v:'ALL'}, {l:'🎯 Exactas',v:'EXACT'}, {l:'✓ Dif.',v:'GOAL_DIFF'},
    {l:'~ Tend.',v:'TENDENCY'}, {l:'✗ Falló',v:'WRONG'}, {l:'⏳ Pend.',v:'PENDING'},
  ];

  editForm = this.fb.group({
    displayName: [this.userProfile()?.displayName ?? '', [Validators.required, Validators.minLength(2)]],
    country:     [this.userProfile()?.country ?? 'Argentina'],
  });

  ngOnInit(): void {
    this.loadPreds();
    this.loadLeagues();
  }

  private async loadLeagues(): Promise<void> {
    const profile = this.auth.userProfile();
    this.loadingLeagues.set(true);
    try {
      const ids    = profile?.leagues ?? [];
      const leagues = await this.leagueService.getUserLeagues(ids);
      this.userLeagues.set(leagues);
    } finally {
      this.loadingLeagues.set(false);
      this.cdr.markForCheck();
    }
  }

  onJoinCodeInput(): void {
    this.joinResolvedLeague.set(null);
    this.joinCodeInvalid.set(false);
    this.joinSuccess.set(false);
    this.alreadyMember.set(false);
    clearTimeout(this.joinTimer);
    const code = this.joinCode.trim();
    if (!code) return;

    this.joinTimer = setTimeout(async () => {
      const league = await this.leagueService.getLeagueByCode(code);
      if (league) {
        this.joinResolvedLeague.set(league);
      } else {
        this.joinCodeInvalid.set(true);
      }
      this.cdr.markForCheck();
    }, 600);
  }

  async joinLeague(): Promise<void> {
    const league = this.joinResolvedLeague();
    const uid    = this.auth.currentUser()?.uid;
    if (!league || !uid) return;

    const already = this.userLeagues().some(l => l.id === league.id);
    if (already) { this.alreadyMember.set(true); return; }

    this.joiningLeague.set(true);
    try {
      await this.leagueService.joinLeague(uid, league.id);
      this.auth.refreshProfile();
      await this.loadLeagues();
      this.joinSuccess.set(true);
      this.joinCode = '';
      this.joinResolvedLeague.set(null);
    } finally {
      this.joiningLeague.set(false);
      this.cdr.markForCheck();
    }
  }

  async leaveLeague(league: League): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    await this.leagueService.leaveLeague(uid, league.id);
    this.auth.refreshProfile();
    await this.loadLeagues();
  }

  private async loadPreds(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.loadingPreds.set(true);
    const [preds, matches] = await Promise.all([
      this.predictionService.getUserPredictions(uid),
      this.matchService.getAllMatches(),
    ]);
    const mmap = new Map(matches.map(m => [m.id, m]));
    const items = preds
      .map(p => ({ prediction: p, match: mmap.get(p.matchId) ?? null }))
      .sort((a,b) => (b.match?.utcDate?.getTime()??0) - (a.match?.utcDate?.getTime()??0));
    this.allItems.set(items);
    this.loadingPreds.set(false);
  }

  get filteredPreds(): ReturnType<typeof signal<PredWithMatch[]>> {
    const f = this.activeFilter();
    return f === 'ALL' ? this.allItems : signal(this.allItems().filter(i => i.prediction.result === f));
  }

  async save(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid || this.editForm.invalid) return;
    this.saving.set(true);
    await this.userService.updateUserProfile(uid, {
      displayName: this.editForm.value.displayName!,
      country:     this.editForm.value.country!,
    });
    this.auth.refreshProfile();
    this.editMode.set(false);
    this.saving.set(false);
  }

  trackById(_: number, i: PredWithMatch): string { return i.prediction.id; }

  async enableNotifs(): Promise<void> {
    this.enabling.set(true); this.notifMsg.set(''); this.notifErr.set(false);
    const res = await this.notif.enable();
    if (res.ok) {
      this.notifMsg.set('¡Listo! Vas a recibir recordatorios antes de cada partido.');
    } else {
      this.notifErr.set(true);
      this.notifMsg.set(
        res.reason === 'denied'      ? 'No diste permiso. Habilitalo desde los ajustes del navegador.'
      : res.reason === 'unsupported' ? 'Tu dispositivo no soporta notificaciones.'
      :                                'No se pudo activar. Intentá de nuevo.'
      );
    }
    this.enabling.set(false);
    this.cdr.markForCheck();
  }
}
