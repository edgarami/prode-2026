import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard }            from './core/guards/admin.guard';
import { ShellComponent }        from './layout/shell/shell.component';

export const routes: Routes = [
  // ── Auth (sin navbar) ────────────────────────────────────────────────
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'registro',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ── App con navbar/footer ─────────────────────────────────────────────
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'mis-apuestas',
        loadComponent: () =>
          import('./features/my-bets/my-bets.component').then(m => m.MyBetsComponent),
      },
      {
        path: 'ranking',
        loadComponent: () =>
          import('./features/ranking/ranking.component').then(m => m.RankingComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'reglas',
        loadComponent: () =>
          import('./features/rules/rules.component').then(m => m.RulesComponent),
      },
      {
        path: 'tabla',
        loadComponent: () =>
          import('./features/standings/standings.component').then(m => m.StandingsComponent),
      },
      {
        path: 'pronosticos',
        loadComponent: () =>
          import('./features/predictions-feed/predictions-feed.component').then(m => m.PredictionsFeedComponent),
      },
      {
        path: 'instalar',
        loadComponent: () =>
          import('./features/install/install.component').then(m => m.InstallComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
