import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatchDoc, MatchStatus, MatchStage, Team } from '../models';

@Injectable({ providedIn: 'root' })
export class FootballApiService {
  private http = inject(HttpClient);

  // En desarrollo usamos el proxy local para evitar CORS.
  // En producción se usa la URL directa (desde GitHub Actions / server).
  private get base(): string {
    const isLocal = window.location.hostname === 'localhost';
    return isLocal
      ? `/api/football/v4/competitions/${environment.competitionCode}`
      : `${environment.footballApiUrl}/competitions/${environment.competitionCode}`;
  }

  private get headers(): HttpHeaders {
    // El proxy ya inyecta el header en dev, pero lo mandamos siempre por si acaso.
    return new HttpHeaders({ 'X-Auth-Token': environment.footballApiKey });
  }

  async getAllMatches(): Promise<MatchDoc[]> {
    const res = await firstValueFrom(
      this.http.get<any>(`${this.base}/matches`, { headers: this.headers }),
    );
    return (res.matches ?? []).map((m: any) => this.mapMatch(m));
  }

  async getMatchesByStatus(status: 'FINISHED' | 'LIVE' | 'SCHEDULED'): Promise<MatchDoc[]> {
    const res = await firstValueFrom(
      this.http.get<any>(`${this.base}/matches?status=${status}`, { headers: this.headers }),
    );
    return (res.matches ?? []).map((m: any) => this.mapMatch(m));
  }

  private mapMatch(m: any): MatchDoc {
    const team = (t: any): Team => ({
      id:        t.id,
      name:      t.name,
      shortName: t.shortName ?? t.name,
      tla:       t.tla ?? t.name?.substring(0, 3).toUpperCase() ?? '???',
      crest:     t.crest ?? '',
    });
    return {
      id:       m.id,
      utcDate:  m.utcDate,
      status:   m.status as MatchStatus,
      stage:    m.stage as MatchStage,
      group:    m.group ?? null,
      matchday: m.matchday ?? 0,
      homeTeam: team(m.homeTeam),
      awayTeam: team(m.awayTeam),
      score: {
        winner:   m.score?.winner ?? null,
        fullTime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
        halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null },
      },
      lastUpdated: m.lastUpdated ?? new Date().toISOString(),
    };
  }
}
