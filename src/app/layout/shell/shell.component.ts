import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent }       from '../navbar/navbar.component';
import { FooterComponent }       from '../footer/footer.component';
import { BottomNavComponent }    from '../bottom-nav/bottom-nav.component';
import { InstallPromptComponent } from '../../shared/components/install-prompt/install-prompt.component';

@Component({
  selector:   'app-shell',
  standalone: true,
  imports:    [RouterOutlet, NavbarComponent, FooterComponent, BottomNavComponent, InstallPromptComponent],
  template: `
    <div class="min-h-screen flex flex-col" style="background-color:#0E0608">
      <app-navbar></app-navbar>
      <!-- pb-20 en mobile para que la bottom nav no tape el contenido -->
      <main class="flex-1 pb-24 md:pb-0"><router-outlet></router-outlet></main>
      <app-footer class="hidden md:block"></app-footer>
      <app-bottom-nav></app-bottom-nav>
      <app-install-prompt></app-install-prompt>
    </div>
  `,
})
export class ShellComponent {}
