import { apiFetch } from "./client";
import type {
  Match, MatchForm, MatchPlayer,
  ApiMatch, ApiMatchPlayer,
} from "../types";

function matchPlayerFromApi(mp: ApiMatchPlayer): MatchPlayer {
  return {
    id: mp.id,
    matchId: mp.match_id,
    playerId: mp.player_id,
    status: mp.status,
    detail: mp.detail,
    minutes: mp.minutes,
    goals: mp.goals,
    saves: mp.saves,
    twoMin: mp.two_min,
  };
}

function matchPlayerToApi(mp: MatchPlayer): Omit<ApiMatchPlayer, "id" | "match_id"> {
  return {
    player_id: mp.playerId,
    status: mp.status,
    detail: mp.detail,
    minutes: mp.minutes,
    goals: mp.goals,
    saves: mp.saves,
    two_min: mp.twoMin,
  };
}

function matchFromApi(m: ApiMatch): Match {
  return {
    id: m.id,
    date: m.date,
    opponent: m.opponent,
    homeAway: m.home_away,
    competition: m.competition,
    scoreFor: m.score_for,
    scoreAgainst: m.score_against,
    notes: m.notes,
    players: (m.players || []).map(matchPlayerFromApi),
  };
}

function matchToApi(m: MatchForm): Omit<ApiMatch, "id" | "players"> {
  return {
    date: m.date,
    opponent: m.opponent,
    home_away: m.homeAway,
    competition: m.competition,
    score_for: Number(m.scoreFor) || 0,
    score_against: Number(m.scoreAgainst) || 0,
    notes: m.notes,
  };
}

export const matchesApi = {
  listMatches: (): Promise<Match[]> =>
    apiFetch<ApiMatch[]>("/matches").then((list) => list.map(matchFromApi)),

  createMatch: (m: MatchForm): Promise<Match> =>
    apiFetch<ApiMatch>("/matches", { method: "POST", body: JSON.stringify(matchToApi(m)) }).then(matchFromApi),

  updateMatch: (m: MatchForm): Promise<Match> =>
    apiFetch<ApiMatch>(`/matches/${m.id}`, { method: "PUT", body: JSON.stringify(matchToApi(m)) }).then(matchFromApi),

  deleteMatch: (id: string): Promise<null> =>
    apiFetch<null>(`/matches/${id}`, { method: "DELETE" }),

  bulkSaveMatchPlayers: (matchId: string, rows: MatchPlayer[]): Promise<MatchPlayer[]> =>
    apiFetch<ApiMatchPlayer[]>(`/matches/${matchId}/players/bulk`, {
      method: "POST",
      body: JSON.stringify({ rows: rows.map(matchPlayerToApi) }),
    }).then((list) => list.map(matchPlayerFromApi)),
};
