import { useState, useEffect } from "react";
import { X, User, ShieldAlert, Pencil, Trash2, Plus, Calendar, Clock, Ruler, HandMetal, Phone, Users } from "lucide-react";
import DatePicker from "@/components/modern-ui/date-picker";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { Select } from "../ui/Select";
import { StatusPill } from "../ui/StatusPill";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { STATUS_META, POSITIONS, HANDS, SEVERITIES } from "../../constants";
import { toISODate, fromISODate, formatDate, isFutureDate } from "../../lib/date";
import { ageFromDob, sanitizePhoneInput } from "../../lib/helpers";
import type { Player, PlayerForm, Injury, NewInjuryForm, DrawerMode, Status, Position, Hand, Severity } from "../../types";
import "./PlayerDrawer.css";

function emptyPlayer(): PlayerForm {
  return {
    id: null, firstName: "", lastName: "", number: "", dob: "",
    status: "Disponible", heightCm: "", parentPhone: "", phoneNumber: "",
    position: POSITIONS[0], hand: "Droite", notes: "", injuries: [],
  };
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="info-row-label">{icon} {label}</div>
      <div className="info-row-value">{value}</div>
    </div>
  );
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

export function PlayerDrawer({
  player, division, mode, onClose, onSave, onDelete, onAddInjury, onRemoveInjury,
}: PlayerDrawerProps) {
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

  const setField = <K extends keyof PlayerForm>(k: K, v: PlayerForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
