export type MatchPlayerStatus = "A joué" | "Banc" | "Blessé" | "Non convoqué";
export type HomeAway = "Domicile" | "Extérieur";

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  status: MatchPlayerStatus;
  detail: string;
  minutes: number;
  goals: number;
  saves: number;
  twoMin: number;
}

export interface Match {
  id: string;
  date: string;
  opponent: string;
  homeAway: HomeAway;
  competition: string;
  scoreFor: number;
  scoreAgainst: number;
  notes: string;
  players: MatchPlayer[];
}

export interface MatchForm {
  id: string | null;
  date: string;
  opponent: string;
  homeAway: HomeAway;
  competition: string;
  scoreFor: number | string;
  scoreAgainst: number | string;
  notes: string;
}
