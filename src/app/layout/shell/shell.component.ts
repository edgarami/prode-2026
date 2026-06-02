import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector:   'app-shell',
  standalone: true,
  imports:    [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col" style="background-color:#0d1117">
      <app-navbar></app-navbar>
      <main class="flex-1"><router-outlet></router-outlet></main>
      <app-footer></app-footer>
    </div>
  `,
})
export class ShellComponent {}
