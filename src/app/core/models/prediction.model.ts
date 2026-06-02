export type PredictionResult = 'EXACT' | 'GOAL_DIFF' | 'TENDENCY' | 'WRONG' | 'PENDING';

export interface Prediction {
  id:             string;
  userId:         string;
  matchId:        number;
  predictedHome:  number;
  predictedAway:  number;
  points:         number;
  result:         PredictionResult;
  calculated:     boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

export interface PredictionDoc {
  id:             string;
  userId:         string;
  matchId:        number;
  predictedHome:  number;
  predictedAway:  number;
  points:         number;
  result:         PredictionResult;
  calculated:     boolean;
  createdAt:      string;
  updatedAt:      string;
}

export const POINTS_CONFIG = {
  EXACT:      15,
  GOAL_DIFF:  10,
  TENDENCY:    5,
  WRONG:       0,
} as const;

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome:    number,
  actualAway:    number,
): { points: number; result: PredictionResult } {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: POINTS_CONFIG.EXACT, result: 'EXACT' };
  }
  const predictedDiff = predictedHome - predictedAway;
  const actualDiff    = actualHome - actualAway;
  if (predictedDiff === actualDiff) {
    return { points: POINTS_CONFIG.GOAL_DIFF, result: 'GOAL_DIFF' };
  }
  if (Math.sign(predictedDiff) === Math.sign(actualDiff)) {
    return { points: POINTS_CONFIG.TENDENCY, result: 'TENDENCY' };
  }
  return { points: POINTS_CONFIG.WRONG, result: 'WRONG' };
}
