import { useState, useEffect, useMemo } from "react";
import { Trophy, Calendar, Pencil, Trash2, Check } from "lucide-react";
import { StatusDot } from "../ui/StatusDot";
import { SummaryTile } from "../ui/SummaryTile";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PRIMARY, SUCCESS, DANGER, DANGER_BG, MATCH_PLAYER_META, MATCH_PLAYER_STATUSES } from "../../constants";
import { formatDate } from "../../lib/date";
import { initials, matchResult } from "../../lib/helpers";
import type { Match, MatchPlayer, Player, MatchPlayerStatus } from "../../types";
import "../trainings/TrainingDetail.css";

interface MatchDetailProps {
  match: Match;
  players: Player[];
  onEdit: () => void;
  onDelete: () => void;
  onSavePlayers: (rows: MatchPlayer[]) => Promise<void>;
}

export function MatchDetail({ match, players, onEdit, onDelete, onSavePlayers }: MatchDetailProps) {
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
        <div className="summary-tiles">
          <SummaryTile label="Ont joué" value={played.length} color={SUCCESS} bg="#E4F1E9" />
          <SummaryTile label="Banc" value={bench.length} color="#3E6FB0" bg="#E4EBF4" />
          <SummaryTile label="Blessés" value={injured.length} color="#DD9A32" bg="#FDF3E3" />
          <SummaryTile label="Non convoqués" value={notCalled.length} color="#8A8F7E" bg="#EDEBE1" />
        </div>

        {players.length === 0 ? (
          <p className="empty-state" style={{ padding: "24px 0" }}>Aucun joueur dans l'effectif.</p>
        ) : (
          <>
            {played.length > 0 && (
              <>
                <h4 className="session-section-title">Ont joué</h4>
                <div className="session-table-wrap">
                  <table className="session-table">
                    <thead><tr><th>Joueur</th><th>Statut</th><th>Min.</th><th>Buts</th><th>Arrêts</th><th>2 min.</th></tr></thead>
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
                              <select value={row.status} onChange={(e) => setRow(row.playerId, { status: e.target.value as MatchPlayerStatus })}
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

            <h4 className="session-section-title" style={{ marginTop: played.length > 0 ? 20 : 0 }}>Tous les joueurs</h4>
            <div className="session-table-wrap">
              <table className="session-table">
                <thead><tr><th>Joueur</th><th>Statut</th><th>Détail</th></tr></thead>
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
                          <select value={row.status} onChange={(e) => setRow(row.playerId, { status: e.target.value as MatchPlayerStatus })}
                            className="session-select" style={{ color: meta.color, background: meta.bg }}>
                            {MATCH_PLAYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <input className="session-input" value={row.detail} onChange={(e) => setRow(row.playerId, { detail: e.target.value })} placeholder="Détail…" />
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
