import { apiFetch } from "./client";
import type {
  Training, TrainingForm, TrainingAttendance,
  ApiTraining, ApiTrainingAttendance,
} from "../types";

function attendanceFromApi(a: ApiTrainingAttendance): TrainingAttendance {
  return {
    id: a.id,
    trainingId: a.training_id,
    playerId: a.player_id,
    status: a.status,
    absenceReason: a.absence_reason,
    shotsMade: a.shots_made,
    shotsAttempted: a.shots_attempted,
    passPct: a.pass_pct,
    rating: a.rating,
  };
}

function attendanceToApi(a: TrainingAttendance): ApiTrainingAttendance {
  return {
    id: a.id,
    training_id: a.trainingId,
    player_id: a.playerId,
    status: a.status,
    absence_reason: a.absenceReason,
    shots_made: a.shotsMade,
    shots_attempted: a.shotsAttempted,
    pass_pct: a.passPct,
    rating: a.rating,
  };
}

function trainingFromApi(t: ApiTraining): Training {
  return {
    id: t.id,
    date: t.date,
    theme: t.theme,
    division: t.division,
    location: t.location,
    notes: t.notes,
    attendance: (t.attendance || []).map(attendanceFromApi),
  };
}

function trainingToApi(t: TrainingForm): Omit<ApiTraining, "id" | "attendance"> {
  return {
    date: t.date,
    theme: t.theme,
    division: t.division,
    location: t.location,
    notes: t.notes,
  };
}

export const trainingsApi = {
  listTrainings: (): Promise<Training[]> =>
    apiFetch<ApiTraining[]>("/trainings").then((list) => list.map(trainingFromApi)),

  createTraining: (t: TrainingForm): Promise<Training> =>
    apiFetch<ApiTraining>("/trainings", { method: "POST", body: JSON.stringify(trainingToApi(t)) }).then(trainingFromApi),

  updateTraining: (t: TrainingForm): Promise<Training> =>
    apiFetch<ApiTraining>(`/trainings/${t.id}`, { method: "PUT", body: JSON.stringify(trainingToApi(t)) }).then(trainingFromApi),

  deleteTraining: (id: string): Promise<null> =>
    apiFetch<null>(`/trainings/${id}`, { method: "DELETE" }),

  bulkSaveAttendance: (trainingId: string, rows: TrainingAttendance[]): Promise<TrainingAttendance[]> =>
    apiFetch<ApiTrainingAttendance[]>(`/trainings/${trainingId}/attendance/bulk`, {
      method: "POST",
      body: JSON.stringify({ rows: rows.map(attendanceToApi) }),
    }).then((list) => list.map(attendanceFromApi)),
};
