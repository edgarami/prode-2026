import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionResult } from '../../../core/models';

@Component({
  selector:   'app-score-badge',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" [ngClass]="cls">
      <span>{{ icon }}</span><span>{{ label }}</span>
      <span *ngIf="points !== undefined" class="font-black">+{{ points }}</span>
    </span>
  `,
})
export class ScoreBadgeComponent {
  @Input({ required: true }) result!: PredictionResult;
  @Input() points?: number;

  get cls(): string {
    return ({
      EXACT:     'bg-green-500/20 text-green-400 border border-green-500/30',
      GOAL_DIFF: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      TENDENCY:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      WRONG:     'bg-red-500/20 text-red-400 border border-red-500/30',
      PENDING:   'bg-gray-700 text-gray-400',
    } as Record<PredictionResult, string>)[this.result] ?? 'bg-gray-700 text-gray-400';
  }
  get icon(): string {
    return ({ EXACT:'🎯', GOAL_DIFF:'✓', TENDENCY:'~', WRONG:'✗', PENDING:'⏳' } as Record<PredictionResult, string>)[this.result] ?? '⏳';
  }
  get label(): string {
    return ({ EXACT:'Exacto', GOAL_DIFF:'Diferencia', TENDENCY:'Tendencia', WRONG:'Incorrecto', PENDING:'Pendiente' } as Record<PredictionResult, string>)[this.result] ?? 'Pendiente';
  }
}
