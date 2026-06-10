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
  leagues:        string[];  // IDs de ligas a las que pertenece
}

export type UserRole = 'user' | 'admin';
