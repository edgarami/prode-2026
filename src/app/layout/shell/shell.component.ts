import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent }       from '../navbar/navbar.component';
import { FooterComponent }       from '../footer/footer.component';
import { InstallPromptComponent } from '../../shared/components/install-prompt/install-prompt.component';

@Component({
  selector:   'app-shell',
  standalone: true,
  imports:    [RouterOutlet, NavbarComponent, FooterComponent, InstallPromptComponent],
  template: `
    <div class="min-h-screen flex flex-col" style="background-color:#0E0608">
      <app-navbar></app-navbar>
      <main class="flex-1"><router-outlet></router-outlet></main>
      <app-footer></app-footer>
      <app-install-prompt></app-install-prompt>
    </div>
  `,
})
export class ShellComponent {}
