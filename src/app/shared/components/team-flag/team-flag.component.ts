import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../../core/models';

@Component({
  selector:   'app-team-flag',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="flex flex-col items-center gap-1">
      <div
        class="rounded-full overflow-hidden bg-surface-light flex items-center justify-center border border-surface-light"
        [ngClass]="{
          'w-8 h-8':   size === 'sm',
          'w-12 h-12': size === 'md',
          'w-16 h-16': size === 'lg',
          'w-20 h-20': size === 'xl'
        }"
      >
        <img *ngIf="team?.crest" [src]="team.crest" [alt]="team.name"
          class="w-full h-full object-contain p-0.5" (error)="onErr($event)"/>
        <span *ngIf="!team?.crest" class="text-xs font-bold text-gray-400">{{ team?.tla ?? '?' }}</span>
      </div>
      <span *ngIf="showName" class="font-bold text-white uppercase"
        [ngClass]="{ 'text-xs': size==='sm', 'text-sm': size==='md', 'text-base': size==='lg'||size==='xl' }">
        {{ team?.tla ?? '' }}
      </span>
    </div>
  `,
})
export class TeamFlagComponent {
  @Input({ required: true }) team!: Team;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showName = true;
  onErr(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
}
