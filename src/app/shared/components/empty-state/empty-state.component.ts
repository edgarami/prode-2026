import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:   'app-empty-state',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div class="text-5xl mb-4">{{ icon }}</div>
      <h3 class="text-lg font-bold text-white mb-2">{{ title }}</h3>
      <p class="text-gray-400 text-sm max-w-xs">{{ description }}</p>
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon        = '⚽';
  @Input() title       = 'Sin resultados';
  @Input() description = '';
}
