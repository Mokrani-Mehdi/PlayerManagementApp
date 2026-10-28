import type { DivisionConfig, Match } from "../types";
import { fromISODate } from "./date";
import { DANGER, DANGER_BG, SUCCESS } from "../constants";

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const b = fromISODate(dob);
  if (!b) return null;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

export function divisionForPlayer(dob: string | null | undefined, config: DivisionConfig[]): string {
  if (!dob) return "Non classé";
  const d = fromISODate(dob);
  if (!d) return "Non classé";
  const year = d.getFullYear();
  for (const c of config) {
    const okMin = c.minYear == null || year >= c.minYear;
    const okMax = c.maxYear == null || year <= c.maxYear;
    if (okMin && okMax) return c.label;
  }
  return "Non classé";
}

export function initials(f?: string, l?: string): string {
  return `${(f?.[0] || "").toUpperCase()}${(l?.[0] || "").toUpperCase()}`;
}

export function sanitizePhoneInput(raw: string): string {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function matchResult(m: Match): { label: string; color: string; bg: string } {
  if (m.scoreFor > m.scoreAgainst) return { label: "Victoire", color: SUCCESS, bg: "#E4F1E9" };
  if (m.scoreFor < m.scoreAgainst) return { label: "Défaite", color: DANGER, bg: DANGER_BG };
  return { label: "Nul", color: "#8A8F7E", bg: "#EDEBE1" };
}
