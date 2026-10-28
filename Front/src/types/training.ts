export type TrainingAttendanceStatus = "Présent" | "Absent" | "Excusé" | "Blessé";

export interface TrainingAttendance {
  id: string;
  trainingId: string;
  playerId: string;
  status: TrainingAttendanceStatus;
  absenceReason: string;
  shotsMade: number;
  shotsAttempted: number;
  passPct: number | null;
  rating: number | null;
}

export interface Training {
  id: string;
  date: string;
  theme: string;
  division: string;
  location: string;
  notes: string;
  attendance: TrainingAttendance[];
}

export interface TrainingForm {
  id: string | null;
  date: string;
  theme: string;
  division: string;
  location: string;
  notes: string;
}
