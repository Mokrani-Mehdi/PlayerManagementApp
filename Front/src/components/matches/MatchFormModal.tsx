import { useState } from "react";
import { X } from "lucide-react";
import DatePicker from "@/components/modern-ui/date-picker";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { Select } from "../ui/Select";
import { INK_FAINT, HOME_AWAY_OPTIONS } from "../../constants";
import { toISODate, fromISODate } from "../../lib/date";
import type { Match, MatchForm, HomeAway } from "../../types";

function emptyMatchForm(): MatchForm {
  return { id: null, date: toISODate(new Date()), opponent: "", homeAway: "Domicile", competition: "", scoreFor: 0, scoreAgainst: 0, notes: "" };
}

interface MatchFormModalProps {
  match?: Match;
  onSave: (f: MatchForm) => Promise<void>;
  onClose: () => void;
}

export function MatchFormModal({ match, onSave, onClose }: MatchFormModalProps) {
  const [form, setForm] = useState<MatchForm>(
    match
      ? { id: match.id, date: match.date, opponent: match.opponent, homeAway: match.homeAway, competition: match.competition, scoreFor: match.scoreFor, scoreAgainst: match.scoreAgainst, notes: match.notes }
      : emptyMatchForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setF = <K extends keyof MatchForm>(k: K, v: MatchForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
