import { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, MapPin, ChevronRight, Trophy } from "lucide-react";
import { MatchFormModal } from "../components/matches/MatchFormModal";
import { MatchDetail } from "../components/matches/MatchDetail";
import { api } from "../api";
import { INK_FAINT } from "../constants";
import { formatDate } from "../lib/date";
import { matchResult } from "../lib/helpers";
import type { Match, MatchForm, MatchPlayer, Player, HomeAway } from "../types";

interface MatchesPageProps {
  players: Player[];
  onNew: (cb: () => void) => void;
}

export function MatchesPage({ players, onNew }: MatchesPageProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterHA, setFilterHA] = useState<"Tous" | HomeAway>("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listMatches();
      setMatches(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    } catch {
      setError("Impossible de charger les matchs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    onNew(() => { setEditingMatch(undefined); setShowForm(true); });
  }, [onNew]);

  const filtered = useMemo(() =>
    filterHA === "Tous" ? matches : matches.filter((m) => m.homeAway === filterHA),
    [matches, filterHA]
  );

  const selected = matches.find((m) => m.id === selectedId);

  const saveMatch = async (form: MatchForm) => {
    const saved = form.id ? await api.updateMatch(form) : await api.createMatch(form);
    setMatches((list) => {
      const exists = list.some((m) => m.id === saved.id);
      return exists
        ? list.map((m) => m.id === saved.id ? { ...saved, players: m.players } : m)
        : [saved, ...list];
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
                      {m.competition && (
                        <div className="sessions-list-meta" style={{ marginTop: 2 }}>{m.competition}</div>
                      )}
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
