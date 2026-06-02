import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:   'app-loading-spinner',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class]="containerClass">
      <div
        class="rounded-full border-2 border-surface-light border-t-primary animate-spin"
        [ngClass]="{
          'w-6 h-6':   size === 'sm',
          'w-10 h-10': size === 'md',
          'w-16 h-16': size === 'lg'
        }"
      ></div>
      <span *ngIf="label" class="ml-3 text-gray-400 text-sm">{{ label }}</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() size:           'sm' | 'md' | 'lg' = 'md';
  @Input() label:          string = '';
  @Input() containerClass: string = 'py-12';
}
