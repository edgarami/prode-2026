export interface RankingEntry {
  rank:           number;
  userId:         string;
  displayName:    string;
  photoURL:       string | null;
  country:        string;
  totalPoints:    number;
  exactScores:    number;
  correctWinners: number;
  predictions:    number;
}
