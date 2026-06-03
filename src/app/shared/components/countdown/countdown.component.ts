import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-countdown',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3">
      <ng-container *ngIf="!expired()">
        <div *ngIf="t().days > 0" class="flex flex-col items-center">
          <span class="text-2xl font-black text-white">{{ pad(t().days) }}</span>
          <span class="text-xs text-gray-400 uppercase">días</span>
        </div>
        <span *ngIf="t().days > 0" class="text-2xl font-black" style="color:#C9A843">:</span>
        <div class="flex flex-col items-center">
          <span class="text-2xl font-black text-white">{{ pad(t().hours) }}</span>
          <span class="text-xs text-gray-400 uppercase">hrs</span>
        </div>
        <span class="text-2xl font-black" style="color:#C9A843">:</span>
        <div class="flex flex-col items-center">
          <span class="text-2xl font-black text-white">{{ pad(t().minutes) }}</span>
          <span class="text-xs text-gray-400 uppercase">min</span>
        </div>
        <ng-container *ngIf="t().days === 0">
          <span class="text-2xl font-black" style="color:#C9A843">:</span>
          <div class="flex flex-col items-center">
            <span class="text-2xl font-black" style="color:#C9A843">{{ pad(t().seconds) }}</span>
            <span class="text-xs text-gray-400 uppercase">seg</span>
          </div>
        </ng-container>
      </ng-container>
      <span *ngIf="expired()" class="text-red-400 font-bold text-sm">⏱ Plazo cerrado</span>
    </div>
  `,
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input({ required: true }) targetDate!: Date;

  t       = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  expired = signal(false);

  private zone = inject(NgZone);
  private cdr  = inject(ChangeDetectorRef);
  private interval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tick();
    // Correr dentro de NgZone para que Angular detecte los cambios en modo zoneless
    this.zone.runOutsideAngular(() => {
      this.interval = setInterval(() => {
        this.zone.run(() => {
          this.tick();
          this.cdr.markForCheck();
        });
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  pad(n: number): string { return n.toString().padStart(2, '0'); }

  private tick(): void {
    const diff = this.targetDate.getTime() - Date.now();
    if (diff <= 0) {
      this.expired.set(true);
      if (this.interval) clearInterval(this.interval);
      return;
    }
    this.t.set({
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
    });
  }
}
