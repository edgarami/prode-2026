export interface UserProfile {
  uid:            string;
  displayName:    string;
  email:          string;
  photoURL:       string | null;
  country:        string;
  totalPoints:    number;
  exactScores:    number;
  correctWinners: number;
  rank:           number;
  createdAt:      Date;
  updatedAt:      Date;
  role:           UserRole;
}

export type UserRole = 'user' | 'admin';
