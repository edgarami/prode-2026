import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  signal, inject, NgZone, WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-countdown',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .cd-unit { position: relative; overflow: hidden; min-width: 3rem; }

    /* Dos clases de flip alternantes — al cambiar de una a otra el browser reinicia la animación */
    @keyframes flip-in {
      0%   { transform: translateY(-60%) scaleY(0.4); opacity: 0; }
      60%  { transform: translateY(8%)   scaleY(1.05); opacity: 1; }
      100% { transform: translateY(0)    scaleY(1);    opacity: 1; }
    }
    .flip-a { animation: flip-in 0.35s cubic-bezier(0.22,0.61,0.36,1) forwards; }
    .flip-b { animation: flip-in 0.35s cubic-bezier(0.22,0.61,0.36,1) forwards; }
  `],
  template: `
    <div class="flex items-end gap-2 sm:gap-3" *ngIf="!expired(); else expiredTpl">

      <!-- Días (solo si > 0) -->
      <ng-container *ngIf="t().days > 0">
        <div class="flex flex-col items-center gap-1">
          <div class="cd-unit flex items-center justify-center rounded-xl px-3 py-2"
               style="background:#1E0E13;border:1px solid #2A1219;min-width:3.5rem">
            <span class="text-3xl sm:text-4xl font-black text-white leading-none"
                  [class.flip-a]="flip().days === 'a'"
                  [class.flip-b]="flip().days === 'b'">
              {{ pad(t().days) }}
            </span>
          </div>
          <span class="text-xs font-semibold uppercase tracking-widest" style="color:#9B2D47">días</span>
        </div>
        <span class="text-3xl sm:text-4xl font-black pb-6 leading-none" style="color:#C9A843">:</span>
      </ng-container>

      <!-- Horas -->
      <div class="flex flex-col items-center gap-1">
        <div class="cd-unit flex items-center justify-center rounded-xl px-3 py-2"
             style="background:#1E0E13;border:1px solid #2A1219;min-width:3.5rem">
          <span class="text-3xl sm:text-4xl font-black text-white leading-none"
                [class.flip-a]="flip().hours === 'a'"
                [class.flip-b]="flip().hours === 'b'">
            {{ pad(t().hours) }}
          </span>
        </div>
        <span class="text-xs font-semibold uppercase tracking-widest" style="color:#9B2D47">hrs</span>
      </div>

      <span class="text-3xl sm:text-4xl font-black pb-6 leading-none" style="color:#C9A843">:</span>

      <!-- Minutos -->
      <div class="flex flex-col items-center gap-1">
        <div class="cd-unit flex items-center justify-center rounded-xl px-3 py-2"
             style="background:#1E0E13;border:1px solid #2A1219;min-width:3.5rem">
          <span class="text-3xl sm:text-4xl font-black text-white leading-none"
                [class.flip-a]="flip().minutes === 'a'"
                [class.flip-b]="flip().minutes === 'b'">
            {{ pad(t().minutes) }}
          </span>
        </div>
        <span class="text-xs font-semibold uppercase tracking-widest" style="color:#9B2D47">min</span>
      </div>

      <span class="text-3xl sm:text-4xl font-black pb-6 leading-none" style="color:#C9A843">:</span>

      <!-- Segundos -->
      <div class="flex flex-col items-center gap-1">
        <div class="cd-unit flex items-center justify-center rounded-xl px-3 py-2"
             style="background:rgba(201,168,67,0.08);border:1px solid rgba(201,168,67,0.25);min-width:3.5rem">
          <span class="text-3xl sm:text-4xl font-black leading-none"
                style="color:#C9A843"
                [class.flip-a]="flip().seconds === 'a'"
                [class.flip-b]="flip().seconds === 'b'">
            {{ pad(t().seconds) }}
          </span>
        </div>
        <span class="text-xs font-semibold uppercase tracking-widest" style="color:#C9A843;opacity:0.6">seg</span>
      </div>

    </div>

    <ng-template #expiredTpl>
      <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-400"
            style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">
        ⏱ Plazo cerrado
      </span>
    </ng-template>
  `,
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input({ required: true }) targetDate!: Date;
  @Output() countdownExpired = new EventEmitter<void>();

  t       = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  expired = signal(false);
  flip    = signal({ days: 'a' as 'a'|'b', hours: 'a' as 'a'|'b', minutes: 'a' as 'a'|'b', seconds: 'a' as 'a'|'b' });

  private zone     = inject(NgZone);
  private cdr      = inject(ChangeDetectorRef);
  private interval?: ReturnType<typeof setInterval>;
  private prev     = { days: -1, hours: -1, minutes: -1, seconds: -1 };

  ngOnInit(): void {
    this.tick();
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
      this.countdownExpired.emit();
      return;
    }

    const next = {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
    };

    // Alternar clase flip cuando el valor cambia → reinicia la animación CSS
    const cur = this.flip();
    this.flip.set({
      days:    next.days    !== this.prev.days    ? (cur.days    === 'a' ? 'b' : 'a') : cur.days,
      hours:   next.hours   !== this.prev.hours   ? (cur.hours   === 'a' ? 'b' : 'a') : cur.hours,
      minutes: next.minutes !== this.prev.minutes ? (cur.minutes === 'a' ? 'b' : 'a') : cur.minutes,
      seconds: next.seconds !== this.prev.seconds ? (cur.seconds === 'a' ? 'b' : 'a') : cur.seconds,
    });

    this.prev = { ...next };
    this.t.set(next);
  }
}
