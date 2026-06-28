export interface UserProfile {
  uid:            string;
  displayName:    string;
  email:          string;
  photoURL:       string | null;
  country:        string;
  totalPoints:    number;   // general (grupos + eliminatorias)
  groupPoints:    number;   // solo fase de grupos
  knockoutPoints: number;   // solo eliminatorias (16vos en adelante)
  exactScores:    number;
  correctWinners: number;
  rank:           number;
  createdAt:      Date;
  updatedAt:      Date;
  role:           UserRole;
  leagues:        string[];  // IDs de ligas a las que pertenece
  fcmTokens?:     string[];  // tokens de dispositivos para push
}

export type UserRole = 'user' | 'admin';
