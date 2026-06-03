import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService }        from '../../core/services/auth.service';
import { UserService }        from '../../core/services/user.service';
import { PredictionService }  from '../../core/services/prediction.service';
import { MatchService }       from '../../core/services/match.service';
import { Prediction, Match, STAGE_LABELS } from '../../core/models';
import { ScoreBadgeComponent }      from '../../shared/components/score-badge/score-badge.component';
import { TeamFlagComponent }        from '../../shared/components/team-flag/team-flag.component';
import { LoadingSpinnerComponent }  from '../../shared/components/loading-spinner/loading-spinner.component';
import { MatchDatePipe }            from '../../shared/pipes/match-date.pipe';

interface PredWithMatch { prediction: Prediction; match: Match | null; }

@Component({
  selector:        'app-profile',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, ScoreBadgeComponent, TeamFlagComponent, LoadingSpinnerComponent, MatchDatePipe],
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
  private fb                = inject(FormBuilder);

  userProfile  = this.auth.userProfile;
  editMode     = signal(false);
  saving       = signal(false);
  loadingPreds = signal(true);
  activeFilter = signal('ALL');
  allItems     = signal<PredWithMatch[]>([]);

  filters = [
    {l:'Todas', v:'ALL'}, {l:'🎯 Exactas',v:'EXACT'}, {l:'✓ Dif.',v:'GOAL_DIFF'},
    {l:'~ Tend.',v:'TENDENCY'}, {l:'✗ Falló',v:'WRONG'}, {l:'⏳ Pend.',v:'PENDING'},
  ];

  editForm = this.fb.group({
    displayName: [this.userProfile()?.displayName ?? '', [Validators.required, Validators.minLength(2)]],
    country:     [this.userProfile()?.country ?? 'Argentina'],
  });

  ngOnInit(): void { this.loadPreds(); }

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
}
