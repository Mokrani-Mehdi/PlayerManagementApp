// App.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, X, Settings2, Trash2, Pencil,
  Ruler, Cake, Phone, HandMetal, ShieldAlert, Calendar, Clock,
  User, Users, ChevronDown, Search, Filter, SortAsc,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";

/* ---------------------------------------------------------
   Domain types
--------------------------------------------------------- */
type Status = "Disponible" | "Blessé" | "En pause" | "En prêt";
type Position =
  | "Gardien" | "Ailier Gauche" | "Ailier Droit"
  | "Arrière Gauche" | "Arrière Droit" | "Demi-centre" | "Pivot";
type Hand = "Gauche" | "Droite" | "Ambidextre";
type Severity = "Légère" | "Modérée" | "Sévère";
type SortKey = "number" | "name" | "age" | "height";
type DrawerMode = "view" | "create" | null;

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
  phoneNumber: number;
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

interface PlayerForm extends Omit<Player, "id" | "number" | "heightCm" | "phoneNumber"> {
  id: string | null;
  number: number | string;
  heightCm: number | string;
  phoneNumber: number | string;
}

interface NewInjuryForm {
  description: string;
  date: string;
  severity: Severity;
  durationWeeks: number | string;
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
  phone_number: number;
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

/* ---------------------------------------------------------
   Design tokens - White & Red theme
--------------------------------------------------------- */
const PRIMARY = "#C41E24"; // Handball red
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

const POSITIONS: Position[] = [
  "Gardien", "Ailier Gauche", "Ailier Droit",
  "Arrière Gauche", "Arrière Droit", "Demi-centre", "Pivot",
];
const HANDS: Hand[] = ["Gauche", "Droite", "Ambidextre"];
const SEVERITIES: Severity[] = ["Légère", "Modérée", "Sévère"];

const DEFAULT_DIVISIONS: DivisionConfig[] = [
  { id: "d1", label: "U10", minYear: 2017, maxYear: 2017 },
  { id: "d2", label: "U12", minYear: 2015, maxYear: 2015 },
  { id: "d3", label: "U14", minYear: 2013, maxYear: 2014 },
  { id: "d4", label: "U16", minYear: 2011, maxYear: 2012 },
  { id: "d5", label: "U18", minYear: 2009, maxYear: 2010 },
  { id: "d6", label: "Senior", minYear: null, maxYear: 2008 },
];

const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://127.0.0.1:8000";

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

function playerToApi(p: PlayerForm | Player): Omit<ApiPlayer, "id" | "injuries"> {
  return {
    first_name: p.firstName,
    last_name: p.lastName,
    number: Number(p.number) || 0,
    dob: p.dob,
    status: p.status,
    height_cm: Number(p.heightCm) || 0,
    parent_phone: p.parentPhone || "",
    phone_number: Number(p.phoneNumber) || 0,
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
    parentPhone: p.parent_phone,
    phoneNumber: p.phone_number,
    position: p.position,
    hand: p.hand,
    notes: p.notes,
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
};

const SAMPLE_PLAYERS: Player[] = [
  {
    id: uid(), firstName: "Lina", lastName: "Bensalem", number: 7,
    dob: "2013-04-12", status: "Disponible", heightCm: 152,
    parentPhone: "06 12 34 56 78", phoneNumber: 612345678,
    position: "Ailier Droit", hand: "Droite",
    notes: "", injuries: [],
  },
  {
    id: uid(), firstName: "Yanis", lastName: "Meziane", number: 4,
    dob: "2011-09-03", status: "Blessé", heightCm: 168,
    parentPhone: "07 22 44 11 09", phoneNumber: 722441109,
    position: "Demi-centre", hand: "Gauche",
    notes: "",
    injuries: [
      { id: uid(), description: "Entorse de la cheville droite à l'entraînement", date: "2026-08-20", severity: "Modérée", durationWeeks: 4 },
    ],
  },
  {
    id: uid(), firstName: "Amel", lastName: "Cherif", number: 12,
    dob: "2009-01-30", status: "Disponible", heightCm: 175,
    parentPhone: "06 65 43 21 00", phoneNumber: 665432100,
    position: "Pivot", hand: "Droite",
    notes: "", injuries: [],
  },
  {
    id: uid(), firstName: "Rayan", lastName: "Haddad", number: 1,
    dob: "2007-11-18", status: "En pause", heightCm: 181,
    parentPhone: "05 55 66 77 88", phoneNumber: 555667788,
    position: "Gardien", hand: "Gauche",
    notes: "Pause pour examens.",
    injuries: [
      { id: uid(), description: "Douleur à l'épaule après un arrêt", date: "2025-12-02", severity: "Légère", durationWeeks: 1 },
    ],
  },
];

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

function divisionForPlayer(dob: string | null | undefined, config: DivisionConfig[]): string {
  if (!dob) return "Non classé";
  const year = new Date(dob).getFullYear();
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
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ---------------------------------------------------------
   UI Components
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

function StatusDot({ status }: { status: Status }) {
  const meta = STATUS_META[status] || STATUS_META.Disponible;
  return <span className="status-dot" style={{ background: meta.color }} />;
}

function StatusPill({ status }: { status: Status }) {
  const meta = STATUS_META[status] || STATUS_META.Disponible;
  return (
    <span className="status-pill" style={{ background: meta.bg, color: meta.color }}>
      <StatusDot status={status} />
      {status}
    </span>
  );
}

/* ---------------------------------------------------------
   Player card
--------------------------------------------------------- */
function PlayerCard({
  player, division, onOpen,
}: {
  player: EnrichedPlayer;
  division: string;
  onOpen: (id: string) => void;
}) {
  const age = ageFromDob(player.dob);
  const hasInjury = player.injuries?.length > 0 && player.status === "Blessé";
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
        <StatusPill status={player.status} />
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
   Player drawer (view / edit / create)
--------------------------------------------------------- */
function emptyPlayer(): PlayerForm {
  return {
    id: null, firstName: "", lastName: "", number: "", dob: "",
    status: "Disponible", heightCm: "", parentPhone: "", phoneNumber: "",
    position: POSITIONS[0], hand: "Droite", notes: "", injuries: [],
  };
}

interface PlayerDrawerProps {
  player: Player | undefined;
  division: string | null;
  mode: DrawerMode;
  onClose: () => void;
  onSave: (p: PlayerForm) => Promise<void>;
  onDelete: (id: string) => void;
  onAddInjury: (playerId: string, injury: NewInjuryForm) => Promise<Injury>;
  onRemoveInjury: (injuryId: string) => Promise<void>;
}

function PlayerDrawer({
  player, division, mode, onClose, onSave, onDelete, onAddInjury, onRemoveInjury,
}: PlayerDrawerProps) {
  const [form, setForm] = useState<PlayerForm>(player ? { ...player } : emptyPlayer());
  const [editing, setEditing] = useState(mode === "create");
  const [newInjury, setNewInjury] = useState<NewInjuryForm>({
    description: "", date: new Date().toISOString().split("T")[0], severity: "Légère", durationWeeks: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "injuries">("info");
  const CustomDateInput = React.forwardRef<HTMLInputElement, any>(
    ({ value, onClick, onChange, placeholder }, ref) => (
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        onChange={onChange}
        placeholder={placeholder}
        className="field-input date-input"
        readOnly
      />
    )
  );
  useEffect(() => {
    setForm(player ? { ...player } : emptyPlayer());
    setEditing(mode === "create");
    setError("");
    setActiveTab("info");
  }, [player, mode]);

  const setField = <K extends keyof PlayerForm>(k: K, v: PlayerForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        number: Number(form.number) || 0,
        heightCm: Number(form.heightCm) || 0,
        phoneNumber: Number(form.phoneNumber) || 0,
      });
      setEditing(false);
    } catch {
      setError("Impossible d'enregistrer. Vérifiez la connexion à l'API.");
    } finally {
      setSaving(false);
    }
  };

  const addInjury = async () => {
    if (!newInjury.description.trim() || !newInjury.date || !form.id) return;
    try {
      const created = await onAddInjury(form.id, newInjury);
      setForm((f) => ({ ...f, injuries: [created, ...(f.injuries || [])] }));
      setNewInjury({ description: "", date: new Date().toISOString().split("T")[0], severity: "Légère", durationWeeks: "" });
    } catch {
      setError("Impossible d'ajouter la blessure. Vérifiez la connexion à l'API.");
    }
  };

  const removeInjury = async (id: string) => {
    try {
      await onRemoveInjury(id);
      setForm((f) => ({ ...f, injuries: f.injuries.filter((i) => i.id !== id) }));
    } catch {
      setError("Impossible de supprimer la blessure. Vérifiez la connexion à l'API.");
    }
  };

  const age = ageFromDob(form.dob);
  const isNew = mode === "create";

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-row">
            <div>
              <div className="drawer-eyebrow">
                {isNew ? "Nouveau joueur" : "Dossier joueur"}
              </div>
              <div className="drawer-title">
                {form.firstName || "Prénom"} {form.lastName || "Nom"}
              </div>
            </div>
            <button onClick={onClose} className="icon-btn icon-btn-light">
              <X size={20} />
            </button>
          </div>
          {!isNew && (
            <div className="drawer-meta-row">
              <span className="division-tag division-tag-amber">{division}</span>
              <StatusPill status={form.status} />
              <span className="drawer-age">{age} ans · #{form.number}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!isNew && (
          <div className="drawer-tabs">
            <button
              className={`drawer-tab ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <User size={14} /> Informations
            </button>
            <button
              className={`drawer-tab ${activeTab === "injuries" ? "active" : ""}`}
              onClick={() => setActiveTab("injuries")}
            >
              <ShieldAlert size={14} /> Blessures ({form.injuries?.length || 0})
            </button>
          </div>
        )}

        <div className="drawer-body">
          {activeTab === "info" || isNew ? (
            <div>
              <div className="section-header">
                <h3 className="section-title">
                  <User size={14} /> Informations
                </h3>
                {!isNew && !editing && (
                  <button onClick={() => setEditing(true)} className="text-link">
                    <Pencil size={13} /> Modifier
                  </button>
                )}
              </div>

              {editing || isNew ? (
                <div className="form-grid">
                  <Field label="Prénom" required><TextInput value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} /></Field>
                  <Field label="Nom" required><TextInput value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} /></Field>
                  <Field label="Numéro" required><TextInput type="number" value={form.number} onChange={(e) => setField("number", e.target.value)} /></Field>
                  <Field label="Date de naissance" required>
                    <DatePicker
                      selected={form.dob ? new Date(form.dob) : null}
                      onChange={(date: Date | null) => setField("dob", date ? date.toISOString().split("T")[0] : "")}
                      dateFormat="dd/MM/yyyy"
                      customInput={<CustomDateInput />}
                      placeholderText="JJ/MM/AAAA"
                      maxDate={new Date()}
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      calendarClassName="handball-calendar"
                      dayClassName={() => "handball-day"}
                      monthClassName={() => "handball-month"}
                      weekDayClassName={() => "handball-weekday"}
                      popperClassName="handball-popper"
                    />
                  </Field>
                  <Field label="Taille (cm)"><TextInput type="number" value={form.heightCm} onChange={(e) => setField("heightCm", e.target.value)} /></Field>
                  <Field label="Téléphone"><TextInput type="number" value={form.phoneNumber} onChange={(e) => setField("phoneNumber", e.target.value)} placeholder="0612345678" /></Field>
                  <Field label="Tél. parent"><TextInput value={form.parentPhone} onChange={(e) => setField("parentPhone", e.target.value)} placeholder="06 12 34 56 78" /></Field>
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
                      <textarea
                        value={form.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        rows={2}
                        className="field-input"
                      />
                    </Field>
                  </div>
                  {error && <div className="form-col-span-2 form-error">{error}</div>}
                  <div className="form-col-span-2 form-actions">
                    <button onClick={save} disabled={saving} className="btn btn-primary btn-flex">
                      {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    {!isNew && (
                      <button
                        onClick={() => { setEditing(false); setForm(player ? { ...player } : emptyPlayer()); setError(""); }}
                        className="btn btn-outline"
                      >
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
            // Injuries tab
            <div className="injury-section">
              <h3 className="section-title section-title-spaced">
                <ShieldAlert size={14} /> Historique des blessures
              </h3>

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
                        <button onClick={() => removeInjury(inj.id)} className="icon-btn-ghost">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="injury-empty">Aucune blessure enregistrée.</p>
              )}

              <div className="injury-form">
                <Field label="Description">
                  <TextInput
                    placeholder="Description de la blessure"
                    value={newInjury.description}
                    onChange={(e) => setNewInjury((s) => ({ ...s, description: e.target.value }))}
                  />
                </Field>
                <div className="injury-form-row">
                  <Field label="Date">
                    <DatePicker
                      selected={newInjury.date ? new Date(newInjury.date) : null}
                      onChange={(date: Date | null) => setNewInjury((s) => ({ ...s, date: date ? date.toISOString().split("T")[0] : "" }))}
                      dateFormat="dd/MM/yyyy"
                      customInput={<CustomDateInput />}
                      placeholderText="JJ/MM/AAAA"
                      maxDate={new Date()}
                      calendarClassName="handball-calendar"
                      dayClassName={() => "handball-day"}
                      popperClassName="handball-popper"
                    />
                  </Field>
                  <Field label="Sévérité">
                    <Select value={newInjury.severity} onChange={(e) => setNewInjury((s) => ({ ...s, severity: e.target.value as Severity }))}>
                      {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="Durée (sem.)">
                    <TextInput
                      type="number"
                      placeholder="Durée"
                      value={newInjury.durationWeeks}
                      onChange={(e) => setNewInjury((s) => ({ ...s, durationWeeks: e.target.value }))}
                    />
                  </Field>
                </div>
                <button onClick={addInjury} className="btn btn-primary btn-block btn-sm">
                  <Plus size={14} /> Ajouter au dossier
                </button>
                {error && <div className="form-error">{error}</div>}
              </div>

              <button
                onClick={() => form.id && onDelete(form.id)}
                className="text-link-danger"
              >
                <Trash2 size={14} /> Supprimer ce joueur
              </button>
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
      <div className="info-row-label">
        {icon} {label}
      </div>
      <div className="info-row-value">{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   Division settings modal
--------------------------------------------------------- */
interface DivisionSettingsProps {
  config: DivisionConfig[];
  onSave: (rows: DivisionConfig[]) => void;
  onClose: () => void;
}

function DivisionSettings({ config, onSave, onClose }: DivisionSettingsProps) {
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
        <p className="modal-desc">
          À ajuster chaque saison : la catégorie d'un joueur dépend de son année de naissance.
        </p>

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

        <button onClick={addRow} className="text-link">
          <Plus size={14} /> Ajouter une catégorie
        </button>

        <button onClick={() => onSave(rows)} className="btn btn-primary btn-block">
          Enregistrer les catégories
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Sort component
--------------------------------------------------------- */
function SortSelector({
  value,
  onChange,
  options,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  options: { value: SortKey; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = options.find((o) => o.value === value)?.label || "Trier";

  return (
    <div className="sort-selector">
      <button
        className="sort-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <SortAsc size={14} />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`sort-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="sort-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`sort-dropdown-item ${value === opt.value ? "active" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
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
   Main App
--------------------------------------------------------- */
export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [divisionConfig, setDivisionConfig] = useState<DivisionConfig[]>(DEFAULT_DIVISIONS);
  //const [loaded, setLoaded] = useState(false);
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
      setConnectionError(
        "Impossible de joindre l'API (" + API_BASE + "). Des données de démonstration sont affichées en attendant."
      );
      setPlayers(SAMPLE_PLAYERS);
      setDivisionConfig(DEFAULT_DIVISIONS);
    } finally {
      //setLoaded(true);
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
    () =>
      divisionLabels
        .map((label) => ({ label, count: enriched.filter((p) => p.division === label).length }))
        .filter((d) => d.count > 0),
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
    const withInjuries: Player = { ...saved, injuries: p.injuries || saved.injuries || [] };
    setPlayers((list) => {
      const exists = list.some((x) => x.id === withInjuries.id);
      return exists ? list.map((x) => (x.id === withInjuries.id ? withInjuries : x)) : [...list, withInjuries];
    });
    setOpenId(withInjuries.id);
    setDrawerMode("view");
  };

  const deletePlayer = async (id: string) => {
    await api.deletePlayer(id).catch(() => { });
    setPlayers((list) => list.filter((p) => p.id !== id));
    setOpenId(null);
    setDrawerMode(null);
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

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-left">
            <div className="header-logo">
              <div className="logo-placeholder">
                <span className="logo-text">HB</span>
              </div>
              <div className="header-brand">
                <div className="header-eyebrow">Club de Handball</div>
                <h1 className="header-title">Effectif</h1>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowSettings(true)} className="icon-btn icon-btn-ghost-light" title="Catégories d'âge">
              <Settings2 size={18} />
            </button>
            <button
              onClick={() => { setOpenId(null); setDrawerMode("create"); }}
              className="btn btn-primary btn-header"
            >
              <Plus size={16} /> Nouveau joueur
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {connectionError && (
          <div className="alert alert-error">{connectionError}</div>
        )}

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
                <span className="section-title">
                  <Filter size={14} /> Filtres
                </span>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-link-sm">Réinitialiser</button>
                )}
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
                  <option value="">Les deux</option>
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
              <div className="empty-state">
                Aucun joueur ne correspond à ces filtres.
              </div>
            ) : (
              <div className="roster-grid">
                {filtered.map((p) => (
                  <PlayerCard key={p.id} player={p} division={p.division} onOpen={(id) => { setOpenId(id); setDrawerMode("view"); }} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {drawerMode && (
        <PlayerDrawer
          player={openPlayer}
          division={openDivision}
          mode={drawerMode}
          onClose={() => { setOpenId(null); setDrawerMode(null); }}
          onSave={savePlayer}
          onDelete={deletePlayer}
          onAddInjury={addInjuryToPlayer}
          onRemoveInjury={removeInjuryFromPlayer}
        />
      )}

      {showSettings && (
        <DivisionSettings
          config={divisionConfig}
          onClose={() => setShowSettings(false)}
          onSave={async (rows) => {
            try {
              const saved = await api.replaceDivisions(rows);
              setDivisionConfig(saved);
            } catch {
              setConnectionError("Impossible d'enregistrer les catégories : vérifiez la connexion à l'API.");
            }
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

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