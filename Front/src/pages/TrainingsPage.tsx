import { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, MapPin, ChevronRight, Dumbbell } from "lucide-react";
import { TrainingFormModal } from "../components/trainings/TrainingFormModal";
import { TrainingDetail } from "../components/trainings/TrainingDetail";
import { api } from "../api";
import { INK_FAINT } from "../constants";
import { formatDate } from "../lib/date";
import type { Training, TrainingForm, TrainingAttendance, Player } from "../types";

interface TrainingsPageProps {
  players: Player[];
  divisionLabels: string[];
  onNew: (cb: () => void) => void;
}

export function TrainingsPage({ players, divisionLabels, onNew }: TrainingsPageProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterDiv, setFilterDiv] = useState<string>("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listTrainings();
      setTrainings(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    } catch {
      setError("Impossible de charger les entraînements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    onNew(() => { setEditingTraining(undefined); setShowForm(true); });
  }, [onNew]);

  const filtered = useMemo(() =>
    filterDiv === "Tous" ? trainings : trainings.filter((t) => t.division === filterDiv),
    [trainings, filterDiv]
  );

  const selected = trainings.find((t) => t.id === selectedId);

  const saveTraining = async (form: TrainingForm) => {
    const saved = form.id ? await api.updateTraining(form) : await api.createTraining(form);
    setTrainings((list) => {
      const exists = list.some((t) => t.id === saved.id);
      return exists
        ? list.map((t) => t.id === saved.id ? { ...saved, attendance: t.attendance } : t)
        : [saved, ...list];
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
                    {t.division && (
                      <span className="division-tag" style={{ fontSize: 10, padding: "1px 6px", marginTop: 4, display: "inline-block" }}>
                        {t.division}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span className="sessions-list-count">
                      {t.attendance.filter((a) => a.status === "Présent").length}/{players.length}
                    </span>
                    <ChevronRight size={14} color={INK_FAINT} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

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
