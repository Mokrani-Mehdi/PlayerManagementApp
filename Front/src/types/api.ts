import type { Status, Position, Hand, Severity } from "./player";
import type { TrainingAttendanceStatus } from "./training";
import type { MatchPlayerStatus, HomeAway } from "./match";

export interface ApiInjury {
  id: string;
  player_id?: string;
  description: string;
  date: string;
  severity: Severity;
  duration_weeks: number;
}

export interface ApiPlayer {
  id: string;
  first_name: string;
  last_name: string;
  number: number;
  dob: string;
  status: Status;
  height_cm: number;
  parent_phone: string;
  phone_number: string;
  position: Position;
  hand: Hand;
  notes: string;
  injuries?: ApiInjury[];
}

export interface ApiDivision {
  id?: string;
  label: string;
  min_year: number | null;
  max_year: number | null;
  sort_order?: number;
}

export interface ApiTrainingAttendance {
  id: string;
  training_id: string;
  player_id: string;
  status: TrainingAttendanceStatus;
  absence_reason: string;
  shots_made: number;
  shots_attempted: number;
  pass_pct: number | null;
  rating: number | null;
}

export interface ApiTraining {
  id: string;
  date: string;
  theme: string;
  division: string;
  location: string;
  notes: string;
  attendance?: ApiTrainingAttendance[];
}

export interface ApiMatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  status: MatchPlayerStatus;
  detail: string;
  minutes: number;
  goals: number;
  saves: number;
  two_min: number;
}

export interface ApiMatch {
  id: string;
  date: string;
  opponent: string;
  home_away: HomeAway;
  competition: string;
  score_for: number;
  score_against: number;
  notes: string;
  players?: ApiMatchPlayer[];
}
