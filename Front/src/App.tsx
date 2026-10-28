// App.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import DatePicker from "@/components/modern-ui/date-picker";
import {
  Plus, X, Settings2, Trash2, Pencil,
  Ruler, Cake, Phone, HandMetal, ShieldAlert, Calendar, Clock,
  User, Users, ChevronDown, Search, Filter, SortAsc,
  Dumbbell, Trophy, MapPin, ChevronRight, Check,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import "./App.css";

/* ---------------------------------------------------------
   Domain types — Players
--------------------------------------------------------- */
type Status = "Disponible" | "Blessé" | "En pause" | "En prêt";
type Position =
  | "Gardien" | "Ailier Gauche" | "Ailier Droit"
  | "Arrière Gauche" | "Arrière Droit" | "Demi-centre" | "Pivot";
type Hand = "Gauche" | "Droite" | "Ambidextre";
type Severity = "Légère" | "Modérée" | "Sévère";
type SortKey = "number" | "name" | "age" | "height";
type DrawerMode = "view" | "create" | null;
type AppTab = "joueurs" | "entrainements" | "matchs";

interface Injury {
  id: string;
  description: string;
  date: string;
  severity: Severity;
  durationWeeks: number;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  dob: string;
  status: Status;
  heightCm: number;
  parentPhone: string;
  phoneNumber: string;
  position: Position;
  hand: Hand;
  notes: string;
  injuries: Injury[];
}

interface EnrichedPlayer extends Player {
  division: string;
  age: number | null;
}

interface DivisionConfig {
  id: string;
  label: string;
  minYear: number | null;
  maxYear: number | null;
}

interface PlayerForm extends Omit<Player, "id" | "number" | "heightCm"> {
  id: string | null;
  number: number | string;
  heightCm: number | string;
}

interface NewInjuryForm {
  description: string;
  date: string;
  severity: Severity;
  durationWeeks: number | string;
}

/* ---------------------------------------------------------
   Domain types — Trainings
--------------------------------------------------------- */
type TrainingAttendanceStatus = "Présent" | "Absent" | "Excusé" | "Blessé";

interface TrainingAttendance {
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

interface Training {
  id: string;
  date: string;
  theme: string;
  division: string;
  location: string;
  notes: string;
  attendance: TrainingAttendance[];
}

interface TrainingForm {
  id: string | null;
  date: string;
  theme: string;
  division: string;
  location: string;
  notes: string;
}

/* ---------------------------------------------------------
   Domain types — Matches
--------------------------------------------------------- */
type MatchPlayerStatus = "A joué" | "Banc" | "Blessé" | "Non convoqué";
type HomeAway = "Domicile" | "Extérieur";

interface MatchPlayer {
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

interface Match {
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

interface MatchForm {
  id: string | null;
  date: string;
  opponent: string;
  homeAway: HomeAway;
  competition: string;
  scoreFor: number | string;
  scoreAgainst: number | string;
  notes: string;
}

/* ---------------------------------------------------------
   Raw API (snake_case) shapes
--------------------------------------------------------- */
interface ApiInjury {
  id: string;
  player_id?: string;
  description: string;
  date: string;
  severity: Severity;
  duration_weeks: number;
}

interface ApiPlayer {
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

interface ApiDivision {
  id?: string;
  label: string;
  min_year: number | null;
  max_year: number | null;
  sort_order?: number;
}

interface ApiTrainingAttendance {
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

interface ApiTraining {
  id: string;
  date: string;
  theme: string;
  division: string;
  location: string;
  notes: string;
  attendance?: ApiTrainingAttendance[];
}

interface ApiMatchPlayer {
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

interface ApiMatch {
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

/* ---------------------------------------------------------
   Design tokens
--------------------------------------------------------- */
const PRIMARY = "#C41E24";
const PRIMARY_DARK = "#9E151A";
const LINE = "#E8E4E0";
const INK_FAINT = "#8A8272";
const DANGER = "#C41E24";
const DANGER_BG = "#FEE8E8";
const SUCCESS = "#2F8F5B";

const STATUS_META: Record<Status, { color: string; bg: string }> = {
  Disponible: { color: SUCCESS, bg: "#E4F1E9" },
  "Blessé": { color: DANGER, bg: DANGER_BG },
  "En pause": { color: "#8A8F7E", bg: "#EDEBE1" },
  "En prêt": { color: "#3E6FB0", bg: "#E4EBF4" },
};

const ATTENDANCE_META: Record<TrainingAttendanceStatus, { color: string; bg: string }> = {
  Présent: { color: SUCCESS, bg: "#E4F1E9" },
  Absent: { color: DANGER, bg: DANGER_BG },
  Excusé: { color: "#3E6FB0", bg: "#E4EBF4" },
  Blessé: { color: "#DD9A32", bg: "#FDF3E3" },
};

const MATCH_PLAYER_META: Record<MatchPlayerStatus, { color: string; bg: string }> = {
  "A joué": { color: SUCCESS, bg: "#E4F1E9" },
  Banc: { color: "#3E6FB0", bg: "#E4EBF4" },
  Blessé: { color: "#DD9A32", bg: "#FDF3E3" },
  "Non convoqué": { color: "#8A8F7E", bg: "#EDEBE1" },
};

const POSITIONS: Position[] = [
  "Gardien", "Ailier Gauche", "Ailier Droit",
  "Arrière Gauche", "Arrière Droit", "Demi-centre", "Pivot",
];
const HANDS: Hand[] = ["Gauche", "Droite", "Ambidextre"];
const SEVERITIES: Severity[] = ["Légère", "Modérée", "Sévère"];
const ATTENDANCE_STATUSES: TrainingAttendanceStatus[] = ["Présent", "Absent", "Excusé", "Blessé"];
const MATCH_PLAYER_STATUSES: MatchPlayerStatus[] = ["A joué", "Banc", "Blessé", "Non convoqué"];
const HOME_AWAY_OPTIONS: HomeAway[] = ["Domicile", "Extérieur"];

const DEFAULT_DIVISIONS: DivisionConfig[] = [
  { id: "d1", label: "U10", minYear: 2017, maxYear: 2017 },
  { id: "d2", label: "U12", minYear: 2015, maxYear: 2015 },
  { id: "d3", label: "U14", minYear: 2013, maxYear: 2014 },
  { id: "d4", label: "U16", minYear: 2011, maxYear: 2012 },
  { id: "d5", label: "U18", minYear: 2009, maxYear: 2010 },
  { id: "d6", label: "Senior", minYear: null, maxYear: 2008 },
];

const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function toISODate(d: Date | undefined): string {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(s: string): Date | undefined {
  if (!s) return undefined;
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "https://playermanagementapp.onrender.com";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status} on ${path}: ${text}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

/* ---------------------------------------------------------
   Mappers — Players
--------------------------------------------------------- */
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

function injuryFromApi(i: ApiInjury): Injury {
  return {
    id: i.id,
    description: i.description,
    date: i.date,
    severity: i.severity,
    durationWeeks: i.duration_weeks,
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

/* ---------------------------------------------------------
   Mappers — Trainings
--------------------------------------------------------- */
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

function trainingToApi(t: TrainingForm): Omit<ApiTraining, "id" | "attendance"> {
  return {
    date: t.date,
    theme: t.theme,
    division: t.division,
    location: t.location,
    notes: t.notes,
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

/* ---------------------------------------------------------
   Mappers — Matches
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   API client
--------------------------------------------------------- */
const api = {
  listPlayers: (): Promise<Player[]> =>
    apiFetch<ApiPlayer[]>("/players").then((list) => list.map(playerFromApi)),
  createPlayer: (p: PlayerForm): Promise<Player> =>
    apiFetch<ApiPlayer>("/players", { method: "POST", body: JSON.stringify(playerToApi(p)) }).then(playerFromApi),
  updatePlayer: (p: PlayerForm): Promise<Player> =>
    apiFetch<ApiPlayer>(`/players/${p.id}`, { method: "PUT", body: JSON.stringify(playerToApi(p)) }).then(playerFromApi),
  deletePlayer: (id: string): Promise<null> => apiFetch<null>(`/players/${id}`, { method: "DELETE" }),
  addInjury: (playerId: string, inj: NewInjuryForm): Promise<Injury> =>
    apiFetch<ApiInjury>(`/players/${playerId}/injuries`, { method: "POST", body: JSON.stringify(injuryToApi(inj)) }).then(injuryFromApi),
  deleteInjury: (id: string): Promise<null> => apiFetch<null>(`/injuries/${id}`, { method: "DELETE" }),
  listDivisions: (): Promise<DivisionConfig[]> =>
    apiFetch<ApiDivision[]>("/divisions").then((list) => list.map(divisionFromApi)),
  replaceDivisions: (rows: DivisionConfig[]): Promise<DivisionConfig[]> =>
    apiFetch<ApiDivision[]>("/divisions", {
      method: "PUT",
      body: JSON.stringify({ divisions: rows.map(divisionToApi) }),
    }).then((list) => list.map(divisionFromApi)),

  listTrainings: (): Promise<Training[]> =>
    apiFetch<ApiTraining[]>("/trainings").then((list) => list.map(trainingFromApi)),
  createTraining: (t: TrainingForm): Promise<Training> =>
    apiFetch<ApiTraining>("/trainings", { method: "POST", body: JSON.stringify(trainingToApi(t)) }).then(trainingFromApi),
  updateTraining: (t: TrainingForm): Promise<Training> =>
    apiFetch<ApiTraining>(`/trainings/${t.id}`, { method: "PUT", body: JSON.stringify(trainingToApi(t)) }).then(trainingFromApi),
  deleteTraining: (id: string): Promise<null> => apiFetch<null>(`/trainings/${id}`, { method: "DELETE" }),
  bulkSaveAttendance: (trainingId: string, rows: TrainingAttendance[]): Promise<TrainingAttendance[]> =>
    apiFetch<ApiTrainingAttendance[]>(`/trainings/${trainingId}/attendance/bulk`, {
      method: "POST",
      body: JSON.stringify({ rows: rows.map(attendanceToApi) }),
    }).then((list) => list.map(attendanceFromApi)),

  listMatches: (): Promise<Match[]> =>
    apiFetch<ApiMatch[]>("/matches").then((list) => list.map(matchFromApi)),
  createMatch: (m: MatchForm): Promise<Match> =>
    apiFetch<ApiMatch>("/matches", { method: "POST", body: JSON.stringify(matchToApi(m)) }).then(matchFromApi),
  updateMatch: (m: MatchForm): Promise<Match> =>
    apiFetch<ApiMatch>(`/matches/${m.id}`, { method: "PUT", body: JSON.stringify(matchToApi(m)) }).then(matchFromApi),
  deleteMatch: (id: string): Promise<null> => apiFetch<null>(`/matches/${id}`, { method: "DELETE" }),
  bulkSaveMatchPlayers: (matchId: string, rows: MatchPlayer[]): Promise<MatchPlayer[]> =>
    apiFetch<ApiMatchPlayer[]>(`/matches/${matchId}/players/bulk`, {
      method: "POST",
      body: JSON.stringify({ rows: rows.map(matchPlayerToApi) }),
    }).then((list) => list.map(matchPlayerFromApi)),
};

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const b = fromISODate(dob);
  if (!b) return null;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

function divisionForPlayer(dob: string | null | undefined, config: DivisionConfig[]): string {
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

function initials(f?: string, l?: string): string {
  return `${(f?.[0] || "").toUpperCase()}${(l?.[0] || "").toUpperCase()}`;
}

function formatDate(d?: string | null): string {
  if (!d) return "—";
  const parsed = fromISODate(d);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function sanitizePhoneInput(raw: string): string {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = fromISODate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d.getTime() > today.getTime();
}

function matchResult(m: Match): { label: string; color: string; bg: string } {
  if (m.scoreFor > m.scoreAgainst) return { label: "Victoire", color: SUCCESS, bg: "#E4F1E9" };
  if (m.scoreFor < m.scoreAgainst) return { label: "Défaite", color: DANGER, bg: DANGER_BG };
  return { label: "Nul", color: "#8A8F7E", bg: "#EDEBE1" };
}

/* ---------------------------------------------------------
   Shared UI primitives
--------------------------------------------------------- */
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={"field-input" + (className ? " " + className : "")} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={"field-input" + (className ? " " + className : "")}>
      {children}
    </select>
  );
}

function StatusDot({ color }: { color: string }) {
  return <span className="status-dot" style={{ background: color }} />;
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="status-pill" style={{ background: bg, color }}>
      <StatusDot color={color} />
      {label}
    </span>
  );
}

function PlayerStatusPill({ status }: { status: Status }) {
  const meta = STATUS_META[status] || STATUS_META.Disponible;
  return <StatusPill label={status} color={meta.color} bg={meta.bg} />;
}

function SummaryTile({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="summary-tile" style={{ background: bg, borderColor: color + "33" }}>
      <div className="summary-tile-value" style={{ color }}>{value}</div>
      <div className="summary-tile-label">{label}</div>
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel = "Supprimer", onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel modal-panel-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onCancel} className="icon-btn-ghost"><X size={20} color={INK_FAINT} /></button>
        </div>
        <p className="modal-desc">{message}</p>
        <div className="form-actions">
          <button onClick={onCancel} className="btn btn-outline btn-flex">Annuler</button>
          <button onClick={onConfirm} className="btn btn-danger btn-flex">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Player card
--------------------------------------------------------- */
function PlayerCard({ player, division, onOpen }: { player: EnrichedPlayer; division: string; onOpen: (id: string) => void }) {
  const age = ageFromDob(player.dob);
  const hasInjury = player.injuries?.length > 0 && player.status === "Blessé";
  const meta = STATUS_META[player.status] || STATUS_META.Disponible;
  return (
    <button onClick={() => onOpen(player.id)} className="player-card">
      <div className="player-card-top">
        <div className="player-avatar">{initials(player.firstName, player.lastName)}</div>
        <div className="player-number-wrap">
          <div className="player-number">{String(player.number).padStart(2, "0")}</div>
          <div className="player-number-label">numéro</div>
        </div>
      </div>
      <div className="player-name">{player.firstName} {player.lastName}</div>
      <div className="player-position">{player.position}</div>
      <div className="player-tags">
        <span className="division-tag">{division}</span>
        <StatusPill label={player.status} color={meta.color} bg={meta.bg} />
        {hasInjury && <ShieldAlert size={14} color={DANGER} />}
      </div>
      <div className="player-meta">
        <span className="player-meta-item"><Cake size={13} /> {age} ans</span>
        <span className="player-meta-item"><Ruler size={13} /> {player.heightCm} cm</span>
        <span className="player-meta-item"><HandMetal size={13} /> {player.hand}</span>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------
   Player drawer
--------------------------------------------------------- */
function emptyPlayer(): PlayerForm {
  return {
    id: null, firstName: "", lastName: "", number: "", dob: "",
    status: "Disponible", heightCm: "", parentPhone: "", phoneNumber: "",
    position: POSITIONS[0], hand: "Droite", notes: "", injuries: [],
  };
}

function PlayerDrawer({
  player, division, mode, onClose, onSave, onDelete, onAddInjury, onRemoveInjury,
}: {
  player: Player | undefined; division: string | null; mode: DrawerMode;
  onClose: () => void; onSave: (p: PlayerForm) => Promise<void>; onDelete: (id: string) => void;
  onAddInjury: (playerId: string, injury: NewInjuryForm) => Promise<Injury>;
  onRemoveInjury: (injuryId: string) => Promise<void>;
}) {
  const [form, setForm] = useState<PlayerForm>(player ? { ...player } : emptyPlayer());
  const [editing, setEditing] = useState(mode === "create");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newInjury, setNewInjury] = useState<NewInjuryForm>({
    description: "", date: toISODate(new Date()), severity: "Légère", durationWeeks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "injuries">("info");

  useEffect(() => {
    setForm(player ? { ...player } : emptyPlayer());
    setEditing(mode === "create");
    setError("");
    setActiveTab("info");
  }, [player, mode]);

  const setField = <K extends keyof PlayerForm>(k: K, v: PlayerForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob) return;
    if (isFutureDate(form.dob)) { setError("La date de naissance ne peut pas être dans le futur."); return; }
    setSaving(true); setError("");
    try {
      await onSave({ ...form, number: Number(form.number) || 0, heightCm: Number(form.heightCm) || 0, phoneNumber: form.phoneNumber.trim() });
      setEditing(false);
    } catch { setError("Impossible d'enregistrer. Vérifiez la connexion à l'API."); }
    finally { setSaving(false); }
  };

  const addInjury = async () => {
    if (!newInjury.description.trim() || !newInjury.date || !form.id) return;
    if (isFutureDate(newInjury.date)) { setError("La date de la blessure ne peut pas être dans le futur."); return; }
    try {
      const created = await onAddInjury(form.id, newInjury);
      setForm((f) => ({ ...f, injuries: [created, ...(f.injuries || [])] }));
      setNewInjury({ description: "", date: toISODate(new Date()), severity: "Légère", durationWeeks: "" });
      setError("");
    } catch { setError("Impossible d'ajouter la blessure."); }
  };

  const removeInjury = async (id: string) => {
    try {
      await onRemoveInjury(id);
      setForm((f) => ({ ...f, injuries: f.injuries.filter((i) => i.id !== id) }));
    } catch { setError("Impossible de supprimer la blessure."); }
  };

  const age = ageFromDob(form.dob);
  const isNew = mode === "create";
  const meta = STATUS_META[form.status] || STATUS_META.Disponible;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-header-row">
            <div>
              <div className="drawer-eyebrow">{isNew ? "Nouveau joueur" : "Dossier joueur"}</div>
              <div className="drawer-title">{form.firstName || "Prénom"} {form.lastName || "Nom"}</div>
            </div>
            <button onClick={onClose} className="icon-btn icon-btn-light"><X size={20} /></button>
          </div>
          {!isNew && (
            <div className="drawer-meta-row">
              <span className="division-tag division-tag-amber">{division}</span>
              <StatusPill label={form.status} color={meta.color} bg={meta.bg} />
              <span className="drawer-age">{age} ans · #{form.number}</span>
            </div>
          )}
        </div>

        {!isNew && (
          <div className="drawer-tabs">
            <button className={`drawer-tab ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>
              <User size={14} /> Informations
            </button>
            <button className={`drawer-tab ${activeTab === "injuries" ? "active" : ""}`} onClick={() => setActiveTab("injuries")}>
              <ShieldAlert size={14} /> Blessures ({form.injuries?.length || 0})
            </button>
          </div>
        )}

        <div className="drawer-body">
          {activeTab === "info" || isNew ? (
            <div>
              <div className="section-header">
                <h3 className="section-title"><User size={14} /> Informations</h3>
                {!isNew && !editing && (
                  <button onClick={() => setEditing(true)} className="text-link"><Pencil size={13} /> Modifier</button>
                )}
              </div>
              {editing || isNew ? (
                <div className="form-grid">
                  <Field label="Prénom" required><TextInput value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} /></Field>
                  <Field label="Nom" required><TextInput value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} /></Field>
                  <Field label="Numéro" required><TextInput type="number" value={form.number} onChange={(e) => setField("number", e.target.value)} /></Field>
                  <Field label="Date de naissance" required>
                    <DatePicker date={fromISODate(form.dob)} setDate={(d) => setField("dob", toISODate(d))} placeholder="JJ/MM/AAAA" className="field-input date-input" />
                  </Field>
                  <Field label="Taille (cm)"><TextInput type="number" value={form.heightCm} onChange={(e) => setField("heightCm", e.target.value)} /></Field>
                  <Field label="Téléphone">
                    <TextInput type="text" inputMode="numeric" value={form.phoneNumber}
                      onChange={(e) => setField("phoneNumber", sanitizePhoneInput(e.target.value))} placeholder="06 12 34 56 78" />
                  </Field>
                  <Field label="Tél. parent">
                    <TextInput value={form.parentPhone} onChange={(e) => setField("parentPhone", e.target.value)} placeholder="06 12 34 56 78" />
                  </Field>
                  <Field label="Main dominante">
                    <Select value={form.hand} onChange={(e) => setField("hand", e.target.value as Hand)}>
                      {HANDS.map((h) => <option key={h}>{h}</option>)}
                    </Select>
                  </Field>
                  <Field label="Poste">
                    <Select value={form.position} onChange={(e) => setField("position", e.target.value as Position)}>
                      {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                    </Select>
                  </Field>
                  <Field label="Statut">
                    <Select value={form.status} onChange={(e) => setField("status", e.target.value as Status)}>
                      {(Object.keys(STATUS_META) as Status[]).map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <div className="form-col-span-2">
                    <Field label="Notes">
                      <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} className="field-input" />
                    </Field>
                  </div>
                  {error && <div className="form-col-span-2 form-error">{error}</div>}
                  <div className="form-col-span-2 form-actions">
                    <button onClick={save} disabled={saving} className="btn btn-primary btn-flex">
                      {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    {!isNew && (
                      <button onClick={() => { setEditing(false); setForm(player ? { ...player } : emptyPlayer()); setError(""); }} className="btn btn-outline">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="info-grid">
                  <InfoRow icon={<Calendar size={14} />} label="Naissance" value={formatDate(form.dob)} />
                  <InfoRow icon={<Ruler size={14} />} label="Taille" value={`${form.heightCm} cm`} />
                  <InfoRow icon={<HandMetal size={14} />} label="Main" value={form.hand} />
                  <InfoRow icon={<Phone size={14} />} label="Téléphone" value={form.phoneNumber || "—"} />
                  <InfoRow icon={<Phone size={14} />} label="Parent" value={form.parentPhone || "—"} />
                  <div className="form-col-span-2"><InfoRow icon={<Users size={14} />} label="Poste" value={form.position} /></div>
                  {form.notes && <div className="form-col-span-2"><InfoRow icon={<Pencil size={14} />} label="Notes" value={form.notes} /></div>}
                </div>
              )}
            </div>
          ) : (
            <div className="injury-section">
              <h3 className="section-title section-title-spaced"><ShieldAlert size={14} /> Historique des blessures</h3>
              {form.injuries?.length ? (
                <div className="injury-list">
                  {form.injuries.map((inj) => (
                    <div key={inj.id} className="injury-item">
                      <div className="injury-dot" />
                      <div className="injury-row">
                        <div>
                          <div className="injury-desc">{inj.description}</div>
                          <div className="injury-meta">
                            <span className="injury-meta-item"><Calendar size={11} /> {formatDate(inj.date)}</span>
                            <span className="injury-meta-item"><Clock size={11} /> {inj.durationWeeks} sem.</span>
                            <span className="injury-severity">{inj.severity}</span>
                          </div>
                        </div>
                        <button onClick={() => removeInjury(inj.id)} className="icon-btn-ghost"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="injury-empty">Aucune blessure enregistrée.</p>}

              <div className="injury-form">
                <Field label="Description">
                  <TextInput placeholder="Description de la blessure" value={newInjury.description}
                    onChange={(e) => setNewInjury((s) => ({ ...s, description: e.target.value }))} />
                </Field>
                <div className="injury-form-row">
                  <Field label="Date">
                    <DatePicker date={fromISODate(newInjury.date)} setDate={(d) => setNewInjury((s) => ({ ...s, date: toISODate(d) }))}
                      placeholder="JJ/MM/AAAA" className="field-input date-input" />
                  </Field>
                  <Field label="Sévérité">
                    <Select value={newInjury.severity} onChange={(e) => setNewInjury((s) => ({ ...s, severity: e.target.value as Severity }))}>
                      {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="Durée (sem.)">
                    <TextInput type="number" placeholder="Durée" value={newInjury.durationWeeks}
                      onChange={(e) => setNewInjury((s) => ({ ...s, durationWeeks: e.target.value }))} />
                  </Field>
                </div>
                <button onClick={addInjury} className="btn btn-primary btn-block btn-sm"><Plus size={14} /> Ajouter au dossier</button>
                {error && <div className="form-error">{error}</div>}
              </div>

              <button onClick={() => setConfirmDelete(true)} className="text-link-danger">
                <Trash2 size={14} /> Supprimer ce joueur
              </button>
              {confirmDelete && (
                <ConfirmDialog
                  title="Supprimer ce joueur ?"
                  message={`Cette action est irréversible. ${form.firstName} ${form.lastName} sera définitivement supprimé(e) du dossier.`}
                  onCancel={() => setConfirmDelete(false)}
                  onConfirm={() => { setConfirmDelete(false); form.id && onDelete(form.id); }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="info-row-label">{icon} {label}</div>
      <div className="info-row-value">{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   Division settings modal
--------------------------------------------------------- */
function DivisionSettings({ config, onSave, onClose }: { config: DivisionConfig[]; onSave: (rows: DivisionConfig[]) => void; onClose: () => void }) {
  const [rows, setRows] = useState<DivisionConfig[]>(config);
  const update = (id: string, key: "minYear" | "maxYear", val: string) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [key]: val === "" ? null : Number(val) } : row)));
  const updateLabel = (id: string, val: string) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, label: val } : row)));
  const addRow = () => setRows((r) => [...r, { id: uid(), label: "Nouvelle", minYear: null, maxYear: null }]);
  const removeRow = (id: string) => setRows((r) => r.filter((row) => row.id !== id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">Catégories d'âge</h2>
          <button onClick={onClose} className="icon-btn-ghost"><X size={20} color={INK_FAINT} /></button>
        </div>
        <p className="modal-desc">À ajuster chaque saison : la catégorie d'un joueur dépend de son année de naissance.</p>
        <div className="division-rows">
          <div className="division-row division-row-header">
            <span>Catégorie</span><span>Année min.</span><span>Année max.</span><span />
          </div>
          {rows.map((row) => (
            <div key={row.id} className="division-row">
              <TextInput value={row.label} onChange={(e) => updateLabel(row.id, e.target.value)} />
              <TextInput type="number" placeholder="—" value={row.minYear ?? ""} onChange={(e) => update(row.id, "minYear", e.target.value)} />
              <TextInput type="number" placeholder="—" value={row.maxYear ?? ""} onChange={(e) => update(row.id, "maxYear", e.target.value)} />
              <button onClick={() => removeRow(row.id)} className="icon-btn-ghost"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <button onClick={addRow} className="text-link"><Plus size={14} /> Ajouter une catégorie</button>
        <button onClick={() => onSave(rows)} className="btn btn-primary btn-block">Enregistrer les catégories</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Sort selector
--------------------------------------------------------- */
function SortSelector({ value, onChange, options }: {
  value: SortKey; onChange: (key: SortKey) => void; options: { value: SortKey; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || "Trier";
  return (
    <div className="sort-selector">
      <button className="sort-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        <SortAsc size={14} />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`sort-chevron ${isOpen ? "open" : ""}`} />
      </button>
      {isOpen && (
        <div className="sort-dropdown">
          {options.map((opt) => (
            <button key={opt.value} className={`sort-dropdown-item ${value === opt.value ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}>
              {opt.label}
              {value === opt.value && <span className="sort-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Training form modal
--------------------------------------------------------- */
function emptyTrainingForm(): TrainingForm {
  return { id: null, date: toISODate(new Date()), theme: "", division: "", location: "", notes: "" };
}

function TrainingFormModal({ training, onSave, onClose }: {
  training?: Training; onSave: (f: TrainingForm) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<TrainingForm>(
    training ? { id: training.id, date: training.date, theme: training.theme, division: training.division, location: training.location, notes: training.notes }
      : emptyTrainingForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const setF = <K extends keyof TrainingForm>(k: K, v: TrainingForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.theme.trim() || !form.date) { setError("Le thème et la date sont obligatoires."); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch { setError("Impossible d'enregistrer. Vérifiez la connexion à l'API."); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">{form.id ? "Modifier l'entraînement" : "Nouvel entraînement"}</h2>
          <button onClick={onClose} className="icon-btn-ghost"><X size={20} color={INK_FAINT} /></button>
        </div>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <Field label="Thème" required>
            <TextInput value={form.theme} onChange={(e) => setF("theme", e.target.value)} placeholder="Ex: Défense, Attaque…" />
          </Field>
          <Field label="Date" required>
            <DatePicker date={fromISODate(form.date)} setDate={(d) => setF("date", toISODate(d))} placeholder="JJ/MM/AAAA" className="field-input date-input" />
          </Field>
          <Field label="Catégorie">
            <TextInput value={form.division} onChange={(e) => setF("division", e.target.value)} placeholder="U16, Senior…" />
          </Field>
          <Field label="Lieu">
            <TextInput value={form.location} onChange={(e) => setF("location", e.target.value)} placeholder="Gymnase, terrain…" />
          </Field>
          <div className="form-col-span-2">
            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} rows={3} className="field-input" placeholder="Notes de séance…" />
            </Field>
          </div>
          {error && <div className="form-col-span-2 form-error">{error}</div>}
          <div className="form-col-span-2 form-actions">
            <button onClick={save} disabled={saving} className="btn btn-primary btn-flex">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={onClose} className="btn btn-outline btn-flex">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Training detail panel
--------------------------------------------------------- */
function TrainingDetail({ training, players, onEdit, onDelete, onSaveAttendance }: {
  training: Training; players: Player[];
  onEdit: () => void; onDelete: () => void;
  onSaveAttendance: (rows: TrainingAttendance[]) => Promise<void>;
}) {
  // Build a map of existing attendance keyed by playerId
  const existingMap = useMemo(() => {
    const m: Record<string, TrainingAttendance> = {};
    for (const a of training.attendance) m[a.playerId] = a;
    return m;
  }, [training.attendance]);

  // Local editable rows — one per player
  const [rows, setRows] = useState<TrainingAttendance[]>(() =>
    players.map((p) => existingMap[p.id] ?? {
      id: "", trainingId: training.id, playerId: p.id,
      status: "Présent", absenceReason: "", shotsMade: 0, shotsAttempted: 0, passPct: null, rating: null,
    })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-sync when training changes
  useEffect(() => {
    const m: Record<string, TrainingAttendance> = {};
    for (const a of training.attendance) m[a.playerId] = a;
    setRows(players.map((p) => m[p.id] ?? {
      id: "", trainingId: training.id, playerId: p.id,
      status: "Présent", absenceReason: "", shotsMade: 0, shotsAttempted: 0, passPct: null, rating: null,
    }));
    setSaved(false);
  }, [training, players]);

  const setRow = (playerId: string, patch: Partial<TrainingAttendance>) =>
    setRows((rs) => rs.map((r) => r.playerId === playerId ? { ...r, ...patch } : r));

  const saveAll = async () => {
    setSaving(true);
    try { await onSaveAttendance(rows); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  const counts = useMemo(() => ({
    présent: rows.filter((r) => r.status === "Présent").length,
    absent: rows.filter((r) => r.status === "Absent").length,
    excusé: rows.filter((r) => r.status === "Excusé").length,
    blessé: rows.filter((r) => r.status === "Blessé").length,
  }), [rows]);

  const playerMap = useMemo(() => {
    const m: Record<string, Player> = {};
    for (const p of players) m[p.id] = p;
    return m;
  }, [players]);

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header" style={{ background: PRIMARY }}>
        <div className="detail-header-row">
          <div>
            <div className="detail-eyebrow"><Dumbbell size={13} /> Entraînement</div>
            <div className="detail-title">{training.theme || "Sans thème"}</div>
            <div className="detail-meta-row">
              <span className="detail-meta-item"><Calendar size={12} /> {formatDate(training.date)}</span>
              {training.location && <span className="detail-meta-item"><MapPin size={12} /> {training.location}</span>}
              {training.division && <span className="division-tag">{training.division}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onEdit} className="icon-btn icon-btn-light" title="Modifier"><Pencil size={16} /></button>
            <button onClick={() => setConfirmDelete(true)} className="icon-btn icon-btn-light" title="Supprimer"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>

      <div className="detail-body">
        {/* Summary tiles */}
        <div className="summary-tiles">
          <SummaryTile label="Présents" value={counts.présent} color={SUCCESS} bg="#E4F1E9" />
          <SummaryTile label="Absents" value={counts.absent} color={DANGER} bg={DANGER_BG} />
          <SummaryTile label="Excusés" value={counts.excusé} color="#3E6FB0" bg="#E4EBF4" />
          <SummaryTile label="Blessés" value={counts.blessé} color="#DD9A32" bg="#FDF3E3" />
        </div>

        {/* Attendance table */}
        {players.length === 0 ? (
          <p className="empty-state" style={{ padding: "24px 0" }}>Aucun joueur dans l'effectif.</p>
        ) : (
          <div className="session-table-wrap">
            <table className="session-table">
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>Présence</th>
                  <th>Motif</th>
                  <th>Tirs (R/T)</th>
                  <th>Passes %</th>
                  <th>Note /5</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const p = playerMap[row.playerId];
                  if (!p) return null;
                  const meta = ATTENDANCE_META[row.status];
                  return (
                    <tr key={row.playerId}>
                      <td>
                        <div className="session-player-cell">
                          <div className="session-avatar">{initials(p.firstName, p.lastName)}</div>
                          <div>
                            <div className="session-player-name">{p.firstName} {p.lastName}</div>
                            <div className="session-player-sub">#{p.number} · {p.position}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={row.status}
                          onChange={(e) => setRow(row.playerId, { status: e.target.value as TrainingAttendanceStatus })}
                          className="session-select"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        {row.status !== "Présent" ? (
                          <input className="session-input" value={row.absenceReason}
                            onChange={(e) => setRow(row.playerId, { absenceReason: e.target.value })}
                            placeholder="Motif…" />
                        ) : <span className="session-empty">—</span>}
                      </td>
                      <td>
                        <div className="session-shots">
                          <input className="session-input session-input-sm" type="number" min={0} value={row.shotsMade}
                            onChange={(e) => setRow(row.playerId, { shotsMade: Number(e.target.value) || 0 })} />
                          <span>/</span>
                          <input className="session-input session-input-sm" type="number" min={0} value={row.shotsAttempted}
                            onChange={(e) => setRow(row.playerId, { shotsAttempted: Number(e.target.value) || 0 })} />
                        </div>
                      </td>
                      <td>
                        <input className="session-input session-input-sm" type="number" min={0} max={100}
                          value={row.passPct ?? ""} placeholder="—"
                          onChange={(e) => setRow(row.playerId, { passPct: e.target.value === "" ? null : Number(e.target.value) })} />
                      </td>
                      <td>
                        <input className="session-input session-input-sm" type="number" min={0} max={5} step={0.5}
                          value={row.rating ?? ""} placeholder="—"
                          onChange={(e) => setRow(row.playerId, { rating: e.target.value === "" ? null : Number(e.target.value) })} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {training.notes && (
          <div className="session-notes">
            <div className="session-notes-label">Notes de séance</div>
            <p>{training.notes}</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={saveAll} disabled={saving} className="btn btn-primary" style={{ minWidth: 160 }}>
            {saved ? <><Check size={14} /> Enregistré</> : saving ? "Enregistrement…" : "Enregistrer la séance"}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cet entraînement ?"
          message="Cette action est irréversible. Toutes les données de présence seront supprimées."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Match form modal
--------------------------------------------------------- */
function emptyMatchForm(): MatchForm {
  return { id: null, date: toISODate(new Date()), opponent: "", homeAway: "Domicile", competition: "", scoreFor: 0, scoreAgainst: 0, notes: "" };
}

function MatchFormModal({ match, onSave, onClose }: {
  match?: Match; onSave: (f: MatchForm) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<MatchForm>(
    match ? { id: match.id, date: match.date, opponent: match.opponent, homeAway: match.homeAway, competition: match.competition, scoreFor: match.scoreFor, scoreAgainst: match.scoreAgainst, notes: match.notes }
      : emptyMatchForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const setF = <K extends keyof MatchForm>(k: K, v: MatchForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.opponent.trim() || !form.date) { setError("L'adversaire et la date sont obligatoires."); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch { setError("Impossible d'enregistrer. Vérifiez la connexion à l'API."); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">{form.id ? "Modifier le match" : "Nouveau match"}</h2>
          <button onClick={onClose} className="icon-btn-ghost"><X size={20} color={INK_FAINT} /></button>
        </div>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <Field label="Adversaire" required>
            <TextInput value={form.opponent} onChange={(e) => setF("opponent", e.target.value)} placeholder="Nom de l'équipe…" />
          </Field>
          <Field label="Date" required>
            <DatePicker date={fromISODate(form.date)} setDate={(d) => setF("date", toISODate(d))} placeholder="JJ/MM/AAAA" className="field-input date-input" />
          </Field>
          <Field label="Domicile / Extérieur">
            <Select value={form.homeAway} onChange={(e) => setF("homeAway", e.target.value as HomeAway)}>
              {HOME_AWAY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Compétition">
            <TextInput value={form.competition} onChange={(e) => setF("competition", e.target.value)} placeholder="Championnat, coupe…" />
          </Field>
          <Field label="Score (pour)">
            <TextInput type="number" min={0} value={form.scoreFor} onChange={(e) => setF("scoreFor", e.target.value)} />
          </Field>
          <Field label="Score (contre)">
            <TextInput type="number" min={0} value={form.scoreAgainst} onChange={(e) => setF("scoreAgainst", e.target.value)} />
          </Field>
          <div className="form-col-span-2">
            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} rows={2} className="field-input" />
            </Field>
          </div>
          {error && <div className="form-col-span-2 form-error">{error}</div>}
          <div className="form-col-span-2 form-actions">
            <button onClick={save} disabled={saving} className="btn btn-primary btn-flex">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={onClose} className="btn btn-outline btn-flex">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Match detail panel
--------------------------------------------------------- */
function MatchDetail({ match, players, onEdit, onDelete, onSavePlayers }: {
  match: Match; players: Player[];
  onEdit: () => void; onDelete: () => void;
  onSavePlayers: (rows: MatchPlayer[]) => Promise<void>;
}) {
  const existingMap = useMemo(() => {
    const m: Record<string, MatchPlayer> = {};
    for (const mp of match.players) m[mp.playerId] = mp;
    return m;
  }, [match.players]);

  const [rows, setRows] = useState<MatchPlayer[]>(() =>
    players.map((p) => existingMap[p.id] ?? {
      id: "", matchId: match.id, playerId: p.id, status: "Non convoqué",
      detail: "", minutes: 0, goals: 0, saves: 0, twoMin: 0,
    })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const m: Record<string, MatchPlayer> = {};
    for (const mp of match.players) m[mp.playerId] = mp;
    setRows(players.map((p) => m[p.id] ?? {
      id: "", matchId: match.id, playerId: p.id, status: "Non convoqué",
      detail: "", minutes: 0, goals: 0, saves: 0, twoMin: 0,
    }));
    setSaved(false);
  }, [match, players]);

  const setRow = (playerId: string, patch: Partial<MatchPlayer>) =>
    setRows((rs) => rs.map((r) => r.playerId === playerId ? { ...r, ...patch } : r));

  const saveAll = async () => {
    setSaving(true);
    try { await onSavePlayers(rows); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  const result = matchResult(match);
  const played = rows.filter((r) => r.status === "A joué");
  const bench = rows.filter((r) => r.status === "Banc");
  const injured = rows.filter((r) => r.status === "Blessé");
  const notCalled = rows.filter((r) => r.status === "Non convoqué");

  const playerMap = useMemo(() => {
    const m: Record<string, Player> = {};
    for (const p of players) m[p.id] = p;
    return m;
  }, [players]);

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header" style={{ background: PRIMARY }}>
        <div className="detail-header-row">
          <div>
            <div className="detail-eyebrow"><Trophy size={13} /> Match</div>
            <div className="detail-title">vs {match.opponent}</div>
            <div className="detail-meta-row">
              <span className="detail-meta-item"><Calendar size={12} /> {formatDate(match.date)}</span>
              <span className="detail-meta-item">{match.homeAway}</span>
              {match.competition && <span className="detail-meta-item">{match.competition}</span>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div className="match-score">{match.scoreFor} – {match.scoreAgainst}</div>
            <span className="status-pill" style={{ background: result.bg, color: result.color }}>
              <StatusDot color={result.color} /> {result.label}
            </span>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={onEdit} className="icon-btn icon-btn-light" title="Modifier"><Pencil size={16} /></button>
              <button onClick={() => setConfirmDelete(true)} className="icon-btn icon-btn-light" title="Supprimer"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-body">
        {/* Summary tiles */}
        <div className="summary-tiles">
          <SummaryTile label="Ont joué" value={played.length} color={SUCCESS} bg="#E4F1E9" />
          <SummaryTile label="Banc" value={bench.length} color="#3E6FB0" bg="#E4EBF4" />
          <SummaryTile label="Blessés" value={injured.length} color="#DD9A32" bg="#FDF3E3" />
          <SummaryTile label="Non convoqués" value={notCalled.length} color="#8A8F7E" bg="#EDEBE1" />
        </div>

        {/* Player status table */}
        {players.length === 0 ? (
          <p className="empty-state" style={{ padding: "24px 0" }}>Aucun joueur dans l'effectif.</p>
        ) : (
          <>
            {/* Players who played */}
            {played.length > 0 && (
              <>
                <h4 className="session-section-title">Ont joué</h4>
                <div className="session-table-wrap">
                  <table className="session-table">
                    <thead>
                      <tr>
                        <th>Joueur</th>
                        <th>Statut</th>
                        <th>Min.</th>
                        <th>Buts</th>
                        <th>Arrêts</th>
                        <th>2 min.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {played.map((row) => {
                        const p = playerMap[row.playerId];
                        if (!p) return null;
                        return (
                          <tr key={row.playerId}>
                            <td>
                              <div className="session-player-cell">
                                <div className="session-avatar">{initials(p.firstName, p.lastName)}</div>
                                <div>
                                  <div className="session-player-name">{p.firstName} {p.lastName}</div>
                                  <div className="session-player-sub">#{p.number} · {p.position}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <select value={row.status}
                                onChange={(e) => setRow(row.playerId, { status: e.target.value as MatchPlayerStatus })}
                                className="session-select" style={{ color: MATCH_PLAYER_META[row.status].color, background: MATCH_PLAYER_META[row.status].bg }}>
                                {MATCH_PLAYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td><input className="session-input session-input-sm" type="number" min={0} value={row.minutes} onChange={(e) => setRow(row.playerId, { minutes: Number(e.target.value) || 0 })} /></td>
                            <td><input className="session-input session-input-sm" type="number" min={0} value={row.goals} onChange={(e) => setRow(row.playerId, { goals: Number(e.target.value) || 0 })} /></td>
                            <td><input className="session-input session-input-sm" type="number" min={0} value={row.saves} onChange={(e) => setRow(row.playerId, { saves: Number(e.target.value) || 0 })} /></td>
                            <td><input className="session-input session-input-sm" type="number" min={0} value={row.twoMin} onChange={(e) => setRow(row.playerId, { twoMin: Number(e.target.value) || 0 })} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Players who didn't play */}
            <h4 className="session-section-title" style={{ marginTop: played.length > 0 ? 20 : 0 }}>Tous les joueurs</h4>
            <div className="session-table-wrap">
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Joueur</th>
                    <th>Statut</th>
                    <th>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const p = playerMap[row.playerId];
                    if (!p) return null;
                    const meta = MATCH_PLAYER_META[row.status];
                    return (
                      <tr key={row.playerId}>
                        <td>
                          <div className="session-player-cell">
                            <div className="session-avatar">{initials(p.firstName, p.lastName)}</div>
                            <div>
                              <div className="session-player-name">{p.firstName} {p.lastName}</div>
                              <div className="session-player-sub">#{p.number} · {p.position}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select value={row.status}
                            onChange={(e) => setRow(row.playerId, { status: e.target.value as MatchPlayerStatus })}
                            className="session-select" style={{ color: meta.color, background: meta.bg }}>
                            {MATCH_PLAYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <input className="session-input" value={row.detail}
                            onChange={(e) => setRow(row.playerId, { detail: e.target.value })}
                            placeholder="Détail…" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={saveAll} disabled={saving} className="btn btn-primary" style={{ minWidth: 160 }}>
            {saved ? <><Check size={14} /> Enregistré</> : saving ? "Enregistrement…" : "Enregistrer le match"}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer ce match ?"
          message="Cette action est irréversible. Toutes les données des joueurs seront supprimées."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Trainings tab
--------------------------------------------------------- */
function TrainingsTab({ players, divisionLabels }: { players: Player[]; divisionLabels: string[] }) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterDiv, setFilterDiv] = useState<string>("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try { const list = await api.listTrainings(); setTrainings(list); if (list.length > 0 && !selectedId) setSelectedId(list[0].id); }
    catch { setError("Impossible de charger les entraînements."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    filterDiv === "Tous" ? trainings : trainings.filter((t) => t.division === filterDiv),
    [trainings, filterDiv]
  );

  const selected = trainings.find((t) => t.id === selectedId);

  const saveTraining = async (form: TrainingForm) => {
    const saved = form.id ? await api.updateTraining(form) : await api.createTraining(form);
    setTrainings((list) => {
      const exists = list.some((t) => t.id === saved.id);
      return exists ? list.map((t) => t.id === saved.id ? { ...saved, attendance: t.attendance } : t) : [saved, ...list];
    });
    setSelectedId(saved.id);
  };

  const deleteTraining = async (id: string) => {
    await api.deleteTraining(id);
    setTrainings((list) => list.filter((t) => t.id !== id));
    setSelectedId(trainings.find((t) => t.id !== id)?.id ?? null);
  };

  const saveAttendance = async (rows: TrainingAttendance[]) => {
    if (!selectedId) return;
    const saved = await api.bulkSaveAttendance(selectedId, rows);
    setTrainings((list) => list.map((t) => t.id === selectedId ? { ...t, attendance: saved } : t));
  };

  if (loading) return <div className="tab-loading">Chargement…</div>;

  return (
    <div className="sessions-layout">
      {/* Left list */}
      <aside className="sessions-aside">
        <div className="sessions-aside-header">
          <div className="sessions-filter-row">
            {["Tous", ...divisionLabels.filter((d) => d !== "Non classé")].map((d) => (
              <button key={d} onClick={() => setFilterDiv(d)}
                className={`sessions-filter-chip ${filterDiv === d ? "active" : ""}`}>{d}</button>
            ))}
          </div>
        </div>
        {error && <div className="alert alert-error" style={{ margin: "8px 12px" }}>{error}</div>}
        {filtered.length === 0 ? (
          <p className="sessions-empty">Aucun entraînement.</p>
        ) : (
          <div className="sessions-list">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`sessions-list-item ${selectedId === t.id ? "active" : ""}`}>
                <div className="sessions-list-item-inner">
                  <div>
                    <div className="sessions-list-title">{t.theme || "Sans thème"}</div>
                    <div className="sessions-list-meta">
                      <span><Calendar size={11} /> {formatDate(t.date)}</span>
                      {t.location && <span><MapPin size={11} /> {t.location}</span>}
                    </div>
                    {t.division && <span className="division-tag" style={{ fontSize: 10, padding: "1px 6px", marginTop: 4, display: "inline-block" }}>{t.division}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span className="sessions-list-count">{t.attendance.filter((a) => a.status === "Présent").length}/{players.length}</span>
                    <ChevronRight size={14} color={INK_FAINT} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Right detail */}
      <div className="sessions-detail">
        {selected ? (
          <TrainingDetail
            training={selected}
            players={players}
            onEdit={() => { setEditingTraining(selected); setShowForm(true); }}
            onDelete={() => deleteTraining(selected.id)}
            onSaveAttendance={saveAttendance}
          />
        ) : (
          <div className="sessions-detail-empty">
            <Dumbbell size={36} color={INK_FAINT} />
            <p>Sélectionnez un entraînement ou créez-en un nouveau.</p>
          </div>
        )}
      </div>

      {showForm && (
        <TrainingFormModal
          training={editingTraining}
          onSave={saveTraining}
          onClose={() => { setShowForm(false); setEditingTraining(undefined); }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Matches tab
--------------------------------------------------------- */
function MatchesTab({ players }: { players: Player[] }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterHA, setFilterHA] = useState<"Tous" | HomeAway>("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try { const list = await api.listMatches(); setMatches(list); if (list.length > 0 && !selectedId) setSelectedId(list[0].id); }
    catch { setError("Impossible de charger les matchs."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    filterHA === "Tous" ? matches : matches.filter((m) => m.homeAway === filterHA),
    [matches, filterHA]
  );

  const selected = matches.find((m) => m.id === selectedId);

  const saveMatch = async (form: MatchForm) => {
    const saved = form.id ? await api.updateMatch(form) : await api.createMatch(form);
    setMatches((list) => {
      const exists = list.some((m) => m.id === saved.id);
      return exists ? list.map((m) => m.id === saved.id ? { ...saved, players: m.players } : m) : [saved, ...list];
    });
    setSelectedId(saved.id);
  };

  const deleteMatch = async (id: string) => {
    await api.deleteMatch(id);
    setMatches((list) => list.filter((m) => m.id !== id));
    setSelectedId(matches.find((m) => m.id !== id)?.id ?? null);
  };

  const saveMatchPlayers = async (rows: MatchPlayer[]) => {
    if (!selectedId) return;
    const saved = await api.bulkSaveMatchPlayers(selectedId, rows);
    setMatches((list) => list.map((m) => m.id === selectedId ? { ...m, players: saved } : m));
  };

  if (loading) return <div className="tab-loading">Chargement…</div>;

  return (
    <div className="sessions-layout">
      {/* Left list */}
      <aside className="sessions-aside">
        <div className="sessions-aside-header">
          <div className="sessions-filter-row">
            {(["Tous", "Domicile", "Extérieur"] as const).map((o) => (
              <button key={o} onClick={() => setFilterHA(o)}
                className={`sessions-filter-chip ${filterHA === o ? "active" : ""}`}>{o}</button>
            ))}
          </div>
        </div>
        {error && <div className="alert alert-error" style={{ margin: "8px 12px" }}>{error}</div>}
        {filtered.length === 0 ? (
          <p className="sessions-empty">Aucun match.</p>
        ) : (
          <div className="sessions-list">
            {filtered.map((m) => {
              const res = matchResult(m);
              return (
                <button key={m.id} onClick={() => setSelectedId(m.id)}
                  className={`sessions-list-item ${selectedId === m.id ? "active" : ""}`}>
                  <div className="sessions-list-item-inner">
                    <div>
                      <div className="sessions-list-title">vs {m.opponent}</div>
                      <div className="sessions-list-meta">
                        <span><Calendar size={11} /> {formatDate(m.date)}</span>
                        <span>{m.homeAway}</span>
                      </div>
                      {m.competition && <div className="sessions-list-meta" style={{ marginTop: 2 }}>{m.competition}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className="match-score-sm">{m.scoreFor}–{m.scoreAgainst}</span>
                      <span className="status-pill" style={{ fontSize: 10, padding: "2px 7px", background: res.bg, color: res.color }}>
                        {res.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* Right detail */}
      <div className="sessions-detail">
        {selected ? (
          <MatchDetail
            match={selected}
            players={players}
            onEdit={() => { setEditingMatch(selected); setShowForm(true); }}
            onDelete={() => deleteMatch(selected.id)}
            onSavePlayers={saveMatchPlayers}
          />
        ) : (
          <div className="sessions-detail-empty">
            <Trophy size={36} color={INK_FAINT} />
            <p>Sélectionnez un match ou créez-en un nouveau.</p>
          </div>
        )}
      </div>

      {showForm && (
        <MatchFormModal
          match={editingMatch}
          onSave={saveMatch}
          onClose={() => { setShowForm(false); setEditingMatch(undefined); }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Main App
--------------------------------------------------------- */
export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("joueurs");
  const [players, setPlayers] = useState<Player[]>([]);
  const [divisionConfig, setDivisionConfig] = useState<DivisionConfig[]>(DEFAULT_DIVISIONS);
  const [connectionError, setConnectionError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [search, setSearch] = useState("");
  const [fDivisions, setFDivisions] = useState<string[]>([]);
  const [fStatuses, setFStatuses] = useState<Status[]>([]);
  const [fPosition, setFPosition] = useState<Position | "">("");
  const [fHand, setFHand] = useState<Hand | "">("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [hMin, setHMin] = useState("");
  const [hMax, setHMax] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("number");

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "number", label: "Numéro" },
    { value: "name", label: "Nom" },
    { value: "age", label: "Âge" },
    { value: "height", label: "Taille" },
  ];

  const reload = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([api.listPlayers(), api.listDivisions()]);
      setPlayers(p);
      setDivisionConfig(d.length ? d : DEFAULT_DIVISIONS);
      setConnectionError("");
    } catch {
      setConnectionError("Impossible de joindre l'API (" + API_BASE + ").");
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const divisionLabels = useMemo(() => [...divisionConfig.map((d) => d.label), "Non classé"], [divisionConfig]);

  const enriched: EnrichedPlayer[] = useMemo(
    () => players.map((p) => ({ ...p, division: divisionForPlayer(p.dob, divisionConfig), age: ageFromDob(p.dob) })),
    [players, divisionConfig]
  );

  const filtered = useMemo(() => {
    const list = enriched.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.firstName} ${p.lastName} ${p.number} ${p.parentPhone} ${p.phoneNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fDivisions.length && !fDivisions.includes(p.division)) return false;
      if (fStatuses.length && !fStatuses.includes(p.status)) return false;
      if (fPosition && p.position !== fPosition) return false;
      if (fHand && p.hand !== fHand) return false;
      if (ageMin !== "" && (p.age ?? 0) < Number(ageMin)) return false;
      if (ageMax !== "" && (p.age ?? 0) > Number(ageMax)) return false;
      if (hMin !== "" && p.heightCm < Number(hMin)) return false;
      if (hMax !== "" && p.heightCm > Number(hMax)) return false;
      return true;
    });
    const cmp: Record<SortKey, (a: EnrichedPlayer, b: EnrichedPlayer) => number> = {
      number: (a, b) => a.number - b.number,
      name: (a, b) => a.lastName.localeCompare(b.lastName),
      age: (a, b) => (a.age ?? 0) - (b.age ?? 0),
      height: (a, b) => b.heightCm - a.heightCm,
    };
    return [...list].sort(cmp[sortBy]);
  }, [enriched, search, fDivisions, fStatuses, fPosition, fHand, ageMin, ageMax, hMin, hMax, sortBy]);

  const chartData = useMemo(
    () => divisionLabels.map((label) => ({ label, count: enriched.filter((p) => p.division === label).length })).filter((d) => d.count > 0),
    [divisionLabels, enriched]
  );

  function toggle<T>(arr: T[], setArr: React.Dispatch<React.SetStateAction<T[]>>, val: T) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const resetFilters = () => {
    setSearch(""); setFDivisions([]); setFStatuses([]); setFPosition(""); setFHand("");
    setAgeMin(""); setAgeMax(""); setHMin(""); setHMax("");
  };

  const activeFilterCount =
    fDivisions.length + fStatuses.length + (fPosition ? 1 : 0) + (fHand ? 1 : 0) +
    (ageMin !== "" ? 1 : 0) + (ageMax !== "" ? 1 : 0) + (hMin !== "" ? 1 : 0) + (hMax !== "" ? 1 : 0);

  const openPlayer = players.find((p) => p.id === openId);
  const openDivision = openPlayer ? divisionForPlayer(openPlayer.dob, divisionConfig) : null;

  const savePlayer = async (p: PlayerForm) => {
    const isNew = !p.id;
    const saved = isNew ? await api.createPlayer(p) : await api.updatePlayer(p);
    const withInjuries: Player = { ...saved, injuries: saved.injuries?.length ? saved.injuries : p.injuries || [] };
    setPlayers((list) => {
      const exists = list.some((x) => x.id === withInjuries.id);
      return exists ? list.map((x) => (x.id === withInjuries.id ? withInjuries : x)) : [...list, withInjuries];
    });
    setOpenId(withInjuries.id);
    setDrawerMode("view");
  };

  const deletePlayer = async (id: string) => {
    try {
      await api.deletePlayer(id);
      setPlayers((list) => list.filter((p) => p.id !== id));
      setOpenId(null);
      setDrawerMode(null);
    } catch {
      setConnectionError("Impossible de supprimer le joueur. Vérifiez la connexion à l'API.");
    }
  };

  const addInjuryToPlayer = async (playerId: string, injury: NewInjuryForm): Promise<Injury> => {
    const created = await api.addInjury(playerId, injury);
    setPlayers((list) => list.map((p) => (p.id === playerId ? { ...p, injuries: [created, ...(p.injuries || [])] } : p)));
    return created;
  };

  const removeInjuryFromPlayer = async (injuryId: string) => {
    await api.deleteInjury(injuryId);
    setPlayers((list) => list.map((p) => ({ ...p, injuries: (p.injuries || []).filter((i) => i.id !== injuryId) })));
  };

  const newButtonLabel = activeTab === "entrainements" ? "Nouvel entraînement" : activeTab === "matchs" ? "Nouveau match" : "Nouveau joueur";

  // Each tab manages its own "new" modal via a shared trigger
  const [triggerNew, setTriggerNew] = useState(0);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-left">
            <div className="header-logo">
              <div className="logo-placeholder"><span className="logo-text">HB</span></div>
              <div className="header-brand">
                <div className="header-eyebrow">Club de Handball</div>
                <h1 className="header-title">Effectif</h1>
              </div>
            </div>
            {/* Nav tabs */}
            <nav className="header-nav">
              <button className={`header-nav-tab ${activeTab === "joueurs" ? "active" : ""}`} onClick={() => setActiveTab("joueurs")}>
                <Users size={14} /> Joueurs
              </button>
              <button className={`header-nav-tab ${activeTab === "entrainements" ? "active" : ""}`} onClick={() => setActiveTab("entrainements")}>
                <Dumbbell size={14} /> Entraînements
              </button>
              <button className={`header-nav-tab ${activeTab === "matchs" ? "active" : ""}`} onClick={() => setActiveTab("matchs")}>
                <Trophy size={14} /> Matchs
              </button>
            </nav>
          </div>
          <div className="header-actions">
            {activeTab === "joueurs" && (
              <button onClick={() => setShowSettings(true)} className="icon-btn icon-btn-ghost-light" title="Catégories d'âge">
                <Settings2 size={18} />
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === "joueurs") { setOpenId(null); setDrawerMode("create"); }
                else setTriggerNew((n) => n + 1);
              }}
              className="btn btn-primary btn-header"
            >
              <Plus size={16} /> {newButtonLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {connectionError && <div className="alert alert-error">{connectionError}</div>}

        {activeTab === "joueurs" && (
          <>
            <div className="stats-row">
              <div className="stats-card">
                <Stat label="Joueurs" value={players.length} />
                <div className="stat-divider" />
                <Stat label="Disponibles" value={enriched.filter((p) => p.status === "Disponible").length} accent={SUCCESS} />
                <div className="stat-divider" />
                <Stat label="Blessés" value={enriched.filter((p) => p.status === "Blessé").length} accent={DANGER} />
                <div className="stat-divider" />
                <Stat label="En pause / prêt" value={enriched.filter((p) => p.status === "En pause" || p.status === "En prêt").length} accent="#8A8F7E" />
              </div>
              <div className="chart-card">
                <div className="chart-card-label">Par catégorie</div>
                <ResponsiveContainer width="100%" height={70}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: INK_FAINT }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? PRIMARY : PRIMARY_DARK} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="layout-row">
              {showFilters && (
                <aside className="filters-aside">
                  <div className="filters-header">
                    <span className="section-title"><Filter size={14} /> Filtres</span>
                    {activeFilterCount > 0 && <button onClick={resetFilters} className="text-link-sm">Réinitialiser</button>}
                  </div>
                  <div className="filters-search">
                    <div className="search-wrapper">
                      <Search size={16} className="search-icon" />
                      <TextInput placeholder="Rechercher un joueur…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                  </div>
                  <FilterGroup title="Catégorie">
                    {divisionLabels.map((d) => (
                      <Checkbox key={d} label={d} checked={fDivisions.includes(d)} onChange={() => toggle(fDivisions, setFDivisions, d)} />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Statut">
                    {(Object.keys(STATUS_META) as Status[]).map((s) => (
                      <Checkbox key={s} label={s} checked={fStatuses.includes(s)} onChange={() => toggle(fStatuses, setFStatuses, s)} />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Poste">
                    <Select value={fPosition} onChange={(e) => setFPosition(e.target.value as Position | "")}>
                      <option value="">Tous</option>
                      {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                    </Select>
                  </FilterGroup>
                  <FilterGroup title="Main dominante">
                    <Select value={fHand} onChange={(e) => setFHand(e.target.value as Hand | "")}>
                      <option value="">Tous</option>
                      {HANDS.map((h) => <option key={h}>{h}</option>)}
                    </Select>
                  </FilterGroup>
                  <FilterGroup title="Âge (ans)">
                    <div className="filter-range">
                      <TextInput type="number" placeholder="Min" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
                      <TextInput type="number" placeholder="Max" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
                    </div>
                  </FilterGroup>
                  <FilterGroup title="Taille (cm)">
                    <div className="filter-range">
                      <TextInput type="number" placeholder="Min" value={hMin} onChange={(e) => setHMin(e.target.value)} />
                      <TextInput type="number" placeholder="Max" value={hMax} onChange={(e) => setHMax(e.target.value)} />
                    </div>
                  </FilterGroup>
                </aside>
              )}
              <section className="roster-section">
                <div className="roster-toolbar">
                  <button onClick={() => setShowFilters((v) => !v)} className="toggle-filters-btn">
                    <Filter size={13} /> {showFilters ? "Masquer filtres" : "Afficher filtres"}
                  </button>
                  <span className="roster-count">{filtered.length} joueur{filtered.length > 1 ? "s" : ""}</span>
                  <SortSelector value={sortBy} onChange={setSortBy} options={sortOptions} />
                </div>
                {filtered.length === 0 ? (
                  <div className="empty-state">Aucun joueur ne correspond à ces filtres.</div>
                ) : (
                  <div className="roster-grid">
                    {filtered.map((p) => (
                      <PlayerCard key={p.id} player={p} division={p.division}
                        onOpen={(id) => { setOpenId(id); setDrawerMode("view"); }} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {activeTab === "entrainements" && (
          <TrainingsTab key={`trainings-${triggerNew}`} players={players} divisionLabels={divisionLabels} />
        )}

        {activeTab === "matchs" && (
          <MatchesTab key={`matches-${triggerNew}`} players={players} />
        )}
      </main>

      {drawerMode && (
        <PlayerDrawer
          player={openPlayer} division={openDivision} mode={drawerMode}
          onClose={() => { setOpenId(null); setDrawerMode(null); }}
          onSave={savePlayer} onDelete={deletePlayer}
          onAddInjury={addInjuryToPlayer} onRemoveInjury={removeInjuryFromPlayer}
        />
      )}

      {showSettings && (
        <DivisionSettings
          config={divisionConfig}
          onClose={() => setShowSettings(false)}
          onSave={async (rows) => {
            try { const saved = await api.replaceDivisions(rows); setDivisionConfig(saved); }
            catch { setConnectionError("Impossible d'enregistrer les catégories."); }
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Small shared components
--------------------------------------------------------- */
function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="filter-group">
      <div className="filter-group-title">{title}</div>
      <div className="filter-group-body">{children}</div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="checkbox-label">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
