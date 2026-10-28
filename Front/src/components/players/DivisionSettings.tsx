import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { Select } from "../ui/Select";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { INK_FAINT, STATUS_META } from "../../constants";
import { uid } from "../../lib/date";
import type { DivisionConfig } from "../../types";

interface DivisionSettingsProps {
  config: DivisionConfig[];
  onSave: (rows: DivisionConfig[]) => void;
  onClose: () => void;
}

export function DivisionSettings({ config, onSave, onClose }: DivisionSettingsProps) {
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
        <button onClick={addRow} className="text-link"><Plus size={14} /> Ajouter une catégorie</button>
        <button onClick={() => onSave(rows)} className="btn btn-primary btn-block">Enregistrer les catégories</button>
      </div>
    </div>
  );
}
