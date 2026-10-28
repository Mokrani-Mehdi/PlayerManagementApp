import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import { PlayerCard } from "../components/players/PlayerCard";
import { TextInput } from "../components/ui/TextInput";
import { Select } from "../components/ui/Select";
import { SortSelector } from "../components/ui/SortSelector";
import { PRIMARY, PRIMARY_DARK, LINE, INK_FAINT, STATUS_META, POSITIONS, HANDS } from "../constants";
import type { Player, EnrichedPlayer, DivisionConfig, Status, Position, Hand, SortKey } from "../types";
import "./PlayersPage.css";

interface PlayersPageProps {
  players: Player[];
  enriched: EnrichedPlayer[];
  divisionConfig: DivisionConfig[];
  divisionLabels: string[];
  onOpenPlayer: (id: string) => void;
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

const SUCCESS = "#2F8F5B";
const DANGER = "#C41E24";

export function PlayersPage({ players, enriched, divisionConfig, divisionLabels, onOpenPlayer }: PlayersPageProps) {
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
    () => divisionLabels
      .map((label) => ({ label, count: enriched.filter((p) => p.division === label).length }))
      .filter((d) => d.count > 0),
    [divisionLabels, enriched]
  );

  return (
    <>
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
              <span className="section-title"><Filter size={14} /> Filtres</span>
              {activeFilterCount > 0 && <button onClick={resetFilters} className="text-link-sm">Réinitialiser</button>}
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
                <option value="">Tous</option>
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
            <div className="empty-state">Aucun joueur ne correspond à ces filtres.</div>
          ) : (
            <div className="roster-grid">
              {filtered.map((p) => (
                <PlayerCard key={p.id} player={p} division={p.division} onOpen={onOpenPlayer} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
