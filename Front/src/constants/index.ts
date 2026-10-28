import type { Status, TrainingAttendanceStatus, MatchPlayerStatus, DivisionConfig, Position, Hand, Severity, HomeAway } from "../types";

export const PRIMARY = "#C41E24";
export const PRIMARY_DARK = "#9E151A";
export const LINE = "#E8E4E0";
export const INK_FAINT = "#8A8272";
export const DANGER = "#C41E24";
export const DANGER_BG = "#FEE8E8";
export const SUCCESS = "#2F8F5B";

export const STATUS_META: Record<Status, { color: string; bg: string }> = {
  Disponible: { color: SUCCESS, bg: "#E4F1E9" },
  "Blessé": { color: DANGER, bg: DANGER_BG },
  "En pause": { color: "#8A8F7E", bg: "#EDEBE1" },
  "En prêt": { color: "#3E6FB0", bg: "#E4EBF4" },
};

export const ATTENDANCE_META: Record<TrainingAttendanceStatus, { color: string; bg: string }> = {
  Présent: { color: SUCCESS, bg: "#E4F1E9" },
  Absent: { color: DANGER, bg: DANGER_BG },
  Excusé: { color: "#3E6FB0", bg: "#E4EBF4" },
  Blessé: { color: "#DD9A32", bg: "#FDF3E3" },
};

export const MATCH_PLAYER_META: Record<MatchPlayerStatus, { color: string; bg: string }> = {
  "A joué": { color: SUCCESS, bg: "#E4F1E9" },
  Banc: { color: "#3E6FB0", bg: "#E4EBF4" },
  Blessé: { color: "#DD9A32", bg: "#FDF3E3" },
  "Non convoqué": { color: "#8A8F7E", bg: "#EDEBE1" },
};

export const POSITIONS: Position[] = [
  "Gardien", "Ailier Gauche", "Ailier Droit",
  "Arrière Gauche", "Arrière Droit", "Demi-centre", "Pivot",
];
export const HANDS: Hand[] = ["Gauche", "Droite", "Ambidextre"];
export const SEVERITIES: Severity[] = ["Légère", "Modérée", "Sévère"];
export const ATTENDANCE_STATUSES: TrainingAttendanceStatus[] = ["Présent", "Absent", "Excusé", "Blessé"];
export const MATCH_PLAYER_STATUSES: MatchPlayerStatus[] = ["A joué", "Banc", "Blessé", "Non convoqué"];
export const HOME_AWAY_OPTIONS: HomeAway[] = ["Domicile", "Extérieur"];

export const DEFAULT_DIVISIONS: DivisionConfig[] = [
  { id: "d1", label: "U10", minYear: 2017, maxYear: 2017 },
  { id: "d2", label: "U12", minYear: 2015, maxYear: 2015 },
  { id: "d3", label: "U14", minYear: 2013, maxYear: 2014 },
  { id: "d4", label: "U16", minYear: 2011, maxYear: 2012 },
  { id: "d5", label: "U18", minYear: 2009, maxYear: 2010 },
  { id: "d6", label: "Senior", minYear: null, maxYear: 2008 },
];
