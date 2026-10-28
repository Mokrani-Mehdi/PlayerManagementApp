import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Settings2, Plus, Users, Dumbbell, Trophy } from "lucide-react";
import { api } from "./api";
import { DEFAULT_DIVISIONS } from "./constants";
import { divisionForPlayer, ageFromDob } from "./lib/helpers";
import { PlayersPage } from "./pages/PlayersPage";
import { TrainingsPage } from "./pages/TrainingsPage";
import { MatchesPage } from "./pages/MatchesPage";
import { PlayerDrawer } from "./components/players/PlayerDrawer";
import { DivisionSettings } from "./components/players/DivisionSettings";
import type {
  Player, PlayerForm, Injury, NewInjuryForm,
  DivisionConfig, EnrichedPlayer, DrawerMode, AppTab,
} from "./types";
import "./styles/globals.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("joueurs");
  const [players, setPlayers] = useState<Player[]>([]);
  const [divisionConfig, setDivisionConfig] = useState<DivisionConfig[]>(DEFAULT_DIVISIONS);
  const [connectionError, setConnectionError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [showSettings, setShowSettings] = useState(false);

  const trainingsNewRef = useRef<(() => void) | null>(null);
  const matchesNewRef = useRef<(() => void) | null>(null);

  const reload = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([api.listPlayers(), api.listDivisions()]);
      setPlayers(p);
      setDivisionConfig(d.length ? d : DEFAULT_DIVISIONS);
      setConnectionError("");
    } catch {
      setConnectionError("Impossible de joindre l'API. Vérifiez votre connexion.");
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const divisionLabels = useMemo(
    () => [...divisionConfig.map((d) => d.label), "Non classé"],
    [divisionConfig]
  );

  const enriched: EnrichedPlayer[] = useMemo(
    () => players.map((p) => ({
      ...p,
      division: divisionForPlayer(p.dob, divisionConfig),
      age: ageFromDob(p.dob),
    })),
    [players, divisionConfig]
  );

  const savePlayer = async (p: PlayerForm) => {
    const isNew = !p.id;
    const saved = isNew ? await api.createPlayer(p) : await api.updatePlayer(p);
    const withInjuries: Player = {
      ...saved,
      injuries: saved.injuries?.length ? saved.injuries : p.injuries || [],
    };
    setPlayers((list) => {
      const exists = list.some((x) => x.id === withInjuries.id);
      return exists
        ? list.map((x) => (x.id === withInjuries.id ? withInjuries : x))
        : [...list, withInjuries];
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
    setPlayers((list) =>
      list.map((p) => p.id === playerId ? { ...p, injuries: [created, ...(p.injuries || [])] } : p)
    );
    return created;
  };

  const removeInjuryFromPlayer = async (injuryId: string) => {
    await api.deleteInjury(injuryId);
    setPlayers((list) =>
      list.map((p) => ({ ...p, injuries: (p.injuries || []).filter((i) => i.id !== injuryId) }))
    );
  };

  const openPlayer = players.find((p) => p.id === openId);
  const openDivision = openPlayer ? divisionForPlayer(openPlayer.dob, divisionConfig) : null;

  const newButtonLabel =
    activeTab === "entrainements" ? "Nouvel entraînement"
    : activeTab === "matchs" ? "Nouveau match"
    : "Nouveau joueur";

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

            <nav className="header-nav">
              <button
                className={`header-nav-tab ${activeTab === "joueurs" ? "active" : ""}`}
                onClick={() => setActiveTab("joueurs")}
              >
                <Users size={14} /> Joueurs
              </button>
              <button
                className={`header-nav-tab ${activeTab === "entrainements" ? "active" : ""}`}
                onClick={() => setActiveTab("entrainements")}
              >
                <Dumbbell size={14} /> Entraînements
              </button>
              <button
                className={`header-nav-tab ${activeTab === "matchs" ? "active" : ""}`}
                onClick={() => setActiveTab("matchs")}
              >
                <Trophy size={14} /> Matchs
              </button>
            </nav>
          </div>

          <div className="header-actions">
            {activeTab === "joueurs" && (
              <button
                onClick={() => setShowSettings(true)}
                className="icon-btn icon-btn-ghost-light"
                title="Catégories d'âge"
              >
                <Settings2 size={18} />
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === "joueurs") { setOpenId(null); setDrawerMode("create"); }
                else if (activeTab === "entrainements") trainingsNewRef.current?.();
                else if (activeTab === "matchs") matchesNewRef.current?.();
              }}
              className="btn btn-primary btn-header"
            >
              <Plus size={16} /> {newButtonLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {connectionError && (
          <div className="alert alert-error">{connectionError}</div>
        )}

        {activeTab === "joueurs" && (
          <PlayersPage
            players={players}
            enriched={enriched}
            divisionConfig={divisionConfig}
            divisionLabels={divisionLabels}
            onOpenPlayer={(id) => { setOpenId(id); setDrawerMode("view"); }}
          />
        )}

        {activeTab === "entrainements" && (
          <TrainingsPage
            players={players}
            divisionLabels={divisionLabels}
            onNew={(cb) => { trainingsNewRef.current = cb; }}
          />
        )}

        {activeTab === "matchs" && (
          <MatchesPage
            players={players}
            onNew={(cb) => { matchesNewRef.current = cb; }}
          />
        )}
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
              setConnectionError("Impossible d'enregistrer les catégories.");
            }
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
