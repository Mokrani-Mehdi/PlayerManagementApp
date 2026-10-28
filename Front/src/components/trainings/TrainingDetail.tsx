import { useState, useEffect, useMemo } from "react";
import { Dumbbell, Calendar, MapPin, Pencil, Trash2, Check } from "lucide-react";
import { SummaryTile } from "../ui/SummaryTile";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PRIMARY, SUCCESS, DANGER, DANGER_BG, ATTENDANCE_META, ATTENDANCE_STATUSES } from "../../constants";
import { formatDate } from "../../lib/date";
import { initials } from "../../lib/helpers";
import type { Training, TrainingAttendance, Player, TrainingAttendanceStatus } from "../../types";
import "./TrainingDetail.css";

interface TrainingDetailProps {
  training: Training;
  players: Player[];
  onEdit: () => void;
  onDelete: () => void;
  onSaveAttendance: (rows: TrainingAttendance[]) => Promise<void>;
}

export function TrainingDetail({ training, players, onEdit, onDelete, onSaveAttendance }: TrainingDetailProps) {
  const existingMap = useMemo(() => {
    const m: Record<string, TrainingAttendance> = {};
    for (const a of training.attendance) m[a.playerId] = a;
    return m;
  }, [training.attendance]);

  const [rows, setRows] = useState<TrainingAttendance[]>(() =>
    players.map((p) => existingMap[p.id] ?? {
      id: "", trainingId: training.id, playerId: p.id,
      status: "Présent", absenceReason: "", shotsMade: 0, shotsAttempted: 0, passPct: null, rating: null,
    })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        <div className="summary-tiles">
          <SummaryTile label="Présents" value={counts.présent} color={SUCCESS} bg="#E4F1E9" />
          <SummaryTile label="Absents" value={counts.absent} color={DANGER} bg={DANGER_BG} />
          <SummaryTile label="Excusés" value={counts.excusé} color="#3E6FB0" bg="#E4EBF4" />
          <SummaryTile label="Blessés" value={counts.blessé} color="#DD9A32" bg="#FDF3E3" />
        </div>

        {players.length === 0 ? (
          <p className="empty-state" style={{ padding: "24px 0" }}>Aucun joueur dans l'effectif.</p>
        ) : (
          <div className="session-table-wrap">
            <table className="session-table">
              <thead>
                <tr>
                  <th>Joueur</th><th>Présence</th><th>Motif</th><th>Tirs (R/T)</th><th>Passes %</th><th>Note /5</th>
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
                        <select value={row.status}
                          onChange={(e) => setRow(row.playerId, { status: e.target.value as TrainingAttendanceStatus })}
                          className="session-select" style={{ color: meta.color, background: meta.bg }}>
                          {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        {row.status !== "Présent"
                          ? <input className="session-input" value={row.absenceReason} onChange={(e) => setRow(row.playerId, { absenceReason: e.target.value })} placeholder="Motif…" />
                          : <span className="session-empty">—</span>}
                      </td>
                      <td>
                        <div className="session-shots">
                          <input className="session-input session-input-sm" type="number" min={0} value={row.shotsMade} onChange={(e) => setRow(row.playerId, { shotsMade: Number(e.target.value) || 0 })} />
                          <span>/</span>
                          <input className="session-input session-input-sm" type="number" min={0} value={row.shotsAttempted} onChange={(e) => setRow(row.playerId, { shotsAttempted: Number(e.target.value) || 0 })} />
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
