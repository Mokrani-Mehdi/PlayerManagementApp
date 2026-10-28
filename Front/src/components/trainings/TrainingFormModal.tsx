import { useState } from "react";
import { X } from "lucide-react";
import DatePicker from "@/components/modern-ui/date-picker";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { INK_FAINT } from "../../constants";
import { toISODate, fromISODate } from "../../lib/date";
import type { Training, TrainingForm } from "../../types";

function emptyTrainingForm(): TrainingForm {
  return { id: null, date: toISODate(new Date()), theme: "", division: "", location: "", notes: "" };
}

interface TrainingFormModalProps {
  training?: Training;
  onSave: (f: TrainingForm) => Promise<void>;
  onClose: () => void;
}

export function TrainingFormModal({ training, onSave, onClose }: TrainingFormModalProps) {
  const [form, setForm] = useState<TrainingForm>(
    training
      ? { id: training.id, date: training.date, theme: training.theme, division: training.division, location: training.location, notes: training.notes }
      : emptyTrainingForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setF = <K extends keyof TrainingForm>(k: K, v: TrainingForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
