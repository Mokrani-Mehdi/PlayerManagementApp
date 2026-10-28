import { apiFetch } from "./client";
import { uid } from "../lib/date";
import type {
  Player, PlayerForm, Injury, NewInjuryForm, DivisionConfig,
  ApiPlayer, ApiInjury, ApiDivision,
} from "../types";

function playerToApi(p: PlayerForm | Player): Omit<ApiPlayer, "id" | "injuries"> {
  return {
    first_name: p.firstName,
    last_name: p.lastName,
    number: Number(p.number) || 0,
    dob: p.dob,
    status: p.status,
    height_cm: Number(p.heightCm) || 0,
    parent_phone: p.parentPhone || "",
    phone_number: (p.phoneNumber || "").trim(),
    position: p.position,
    hand: p.hand,
    notes: p.notes || "",
  };
}

function injuryFromApi(i: ApiInjury): Injury {
  return {
    id: i.id,
    description: i.description,
    date: i.date,
    severity: i.severity,
    durationWeeks: i.duration_weeks,
  };
}

function playerFromApi(p: ApiPlayer): Player {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    number: p.number,
    dob: p.dob,
    status: p.status,
    heightCm: p.height_cm,
    parentPhone: p.parent_phone ?? "",
    phoneNumber: p.phone_number ?? "",
    position: p.position,
    hand: p.hand,
    notes: p.notes ?? "",
    injuries: (p.injuries || []).map(injuryFromApi),
  };
}

function injuryToApi(i: NewInjuryForm): Omit<ApiInjury, "id"> {
  return {
    description: i.description,
    date: i.date,
    severity: i.severity,
    duration_weeks: Number(i.durationWeeks) || 0,
  };
}

function divisionToApi(d: DivisionConfig, sortOrder: number): ApiDivision {
  return { label: d.label, min_year: d.minYear, max_year: d.maxYear, sort_order: sortOrder };
}

function divisionFromApi(d: ApiDivision): DivisionConfig {
  return { id: d.id || uid(), label: d.label, minYear: d.min_year, maxYear: d.max_year };
}

export const playersApi = {
  listPlayers: (): Promise<Player[]> =>
    apiFetch<ApiPlayer[]>("/players").then((list) => list.map(playerFromApi)),

  createPlayer: (p: PlayerForm): Promise<Player> =>
    apiFetch<ApiPlayer>("/players", { method: "POST", body: JSON.stringify(playerToApi(p)) }).then(playerFromApi),

  updatePlayer: (p: PlayerForm): Promise<Player> =>
    apiFetch<ApiPlayer>(`/players/${p.id}`, { method: "PUT", body: JSON.stringify(playerToApi(p)) }).then(playerFromApi),

  deletePlayer: (id: string): Promise<null> =>
    apiFetch<null>(`/players/${id}`, { method: "DELETE" }),

  addInjury: (playerId: string, inj: NewInjuryForm): Promise<Injury> =>
    apiFetch<ApiInjury>(`/players/${playerId}/injuries`, {
      method: "POST",
      body: JSON.stringify(injuryToApi(inj)),
    }).then(injuryFromApi),

  deleteInjury: (id: string): Promise<null> =>
    apiFetch<null>(`/injuries/${id}`, { method: "DELETE" }),

  listDivisions: (): Promise<DivisionConfig[]> =>
    apiFetch<ApiDivision[]>("/divisions").then((list) => list.map(divisionFromApi)),

  replaceDivisions: (rows: DivisionConfig[]): Promise<DivisionConfig[]> =>
    apiFetch<ApiDivision[]>("/divisions", {
      method: "PUT",
      body: JSON.stringify({ divisions: rows.map(divisionToApi) }),
    }).then((list) => list.map(divisionFromApi)),
};
