export type MatchStatus = 'TIMED' | 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
export type MatchStage  = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL';

export interface Team {
  id:        number;
  name:      string;
  shortName: string;
  tla:       string;
  crest:     string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface MatchResult {
  winner:   'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  fullTime: Score;
  halfTime: Score;
}

export interface Match {
  id:          number;
  utcDate:     Date;
  status:      MatchStatus;
  stage:       MatchStage;
  group:       string | null;
  homeTeam:    Team;
  awayTeam:    Team;
  score:       MatchResult;
  matchday:    number;
  lastUpdated: Date;
}

export interface MatchDoc {
  id:          number;
  utcDate:     string;
  status:      MatchStatus;
  stage:       MatchStage;
  group:       string | null;
  homeTeam:    Team;
  awayTeam:    Team;
  score:       MatchResult;
  matchday:    number;
  lastUpdated: string;
}

// La API de football-data.org usa LAST_32 / LAST_16; los normalizamos a nuestros nombres
export function normalizeStage(raw: string | null | undefined): MatchStage {
  switch (raw) {
    case 'LAST_32':  return 'ROUND_OF_32';
    case 'LAST_16':  return 'ROUND_OF_16';
    default:         return (raw as MatchStage) ?? 'GROUP_STAGE';
  }
}

// Fase a la que pertenece una etapa: 'group' o 'knockout' (16vos en adelante)
export function stagePhase(stage: MatchStage): 'group' | 'knockout' {
  return stage === 'GROUP_STAGE' ? 'group' : 'knockout';
}

export const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP_STAGE:    'Fase de Grupos',
  ROUND_OF_32:   'Ronda de 32',
  ROUND_OF_16:   'Octavos de Final',
  QUARTER_FINALS:'Cuartos de Final',
  SEMI_FINALS:   'Semifinales',
  THIRD_PLACE:   'Tercer Puesto',
  FINAL:         'Final',
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  TIMED:      'Programado',
  SCHEDULED:  'Programado',
  IN_PLAY:    'En Juego',
  PAUSED:     'Pausado',
  FINISHED:   'Finalizado',
  POSTPONED:  'Postergado',
  CANCELLED:  'Cancelado',
};
