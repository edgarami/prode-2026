import {
  Component, ElementRef, ViewChild, NgZone, inject,
  ChangeDetectionStrategy, signal, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  oscSpeed: number;
  oscDist: number;
  opacity: number;
}

@Component({
  selector:        'app-confetti',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas *ngIf="active()"
      class="fixed inset-0 z-[60] pointer-events-none"
      style="width:100vw;height:100vh"></canvas>

    <!-- Toast de festejo -->
    <div *ngIf="toast()" class="fixed top-20 left-1/2 -translate-x-1/2 z-[61] animate-slide-up px-4 w-full max-w-sm pointer-events-none">
      <div class="rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl"
           style="background:linear-gradient(135deg,#1E0E13,#2A1219);border:1px solid rgba(201,168,67,0.5);box-shadow:0 0 30px rgba(201,168,67,0.3)">
        <span class="text-3xl">{{ toastIcon() }}</span>
        <div>
          <p class="font-black text-white text-sm">{{ toastTitle() }}</p>
          <p class="text-xs mt-0.5" style="color:#C9A843">{{ toastMsg() }}</p>
        </div>
      </div>
    </div>
  `,
})
export class ConfettiComponent implements OnDestroy {
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  active     = signal(false);
  toast      = signal(false);
  toastIcon  = signal('🎯');
  toastTitle = signal('');
  toastMsg   = signal('');

  private zone = inject(NgZone);
  private raf  = 0;
  private toastTimer: any = null;

  /** Lanza confetti + toast. */
  celebrate(opts: { icon: string; title: string; message: string; duration?: number }): void {
    this.toastIcon.set(opts.icon);
    this.toastTitle.set(opts.title);
    this.toastMsg.set(opts.message);
    this.toast.set(true);
    this.active.set(true);

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(false), 5000);

    // Esperar al render del canvas
    setTimeout(() => this.start(opts.duration ?? 4000), 50);
  }

  private start(duration: number): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Paleta vinotinto + dorado + blanco
    const colors = ['#C9A843', '#E2C06A', '#A8872E', '#7B1F35', '#9B2D47', '#ffffff', '#f59e0b'];

    const particles: Particle[] = Array.from({ length: Math.min(180, W / 4) }, () => ({
      x:        Math.random() * W,
      y:        -20 - Math.random() * H * 0.5,
      vx:       (Math.random() - 0.5) * 1.5,
      vy:       2 + Math.random() * 3,
      w:        6 + Math.random() * 6,
      h:        8 + Math.random() * 8,
      color:    colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      oscSpeed: 0.5 + Math.random() * 2,
      oscDist:  20 + Math.random() * 40,
      opacity:  1,
    }));

    const startTime = performance.now();

    this.zone.runOutsideAngular(() => {
      const animate = (now: number) => {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, W, H);

        let alive = false;
        for (const p of particles) {
          p.y += p.vy;
          p.x += p.vx + Math.sin((elapsed / 1000) * p.oscSpeed) * 0.8;
          p.rotation += p.rotSpeed;

          // Fade out al final
          if (elapsed > duration - 800) {
            p.opacity = Math.max(0, 1 - (elapsed - (duration - 800)) / 800);
          }

          if (p.y < H + 30 && p.opacity > 0) alive = true;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }

        if (alive && elapsed < duration) {
          this.raf = requestAnimationFrame(animate);
        } else {
          this.zone.run(() => this.active.set(false));
        }
      };
      this.raf = requestAnimationFrame(animate);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.toastTimer);
  }
}
