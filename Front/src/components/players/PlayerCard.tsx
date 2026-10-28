import { ShieldAlert } from "lucide-react";
import { Cake, Ruler, HandMetal } from "lucide-react";
import { StatusPill } from "../ui/StatusPill";
import { STATUS_META, DANGER } from "../../constants";
import { ageFromDob, initials } from "../../lib/helpers";
import type { EnrichedPlayer } from "../../types";
import "./PlayerCard.css";

export function PlayerCard({ player, division, onOpen }: {
  player: EnrichedPlayer;
  division: string;
  onOpen: (id: string) => void;
}) {
  const age = ageFromDob(player.dob);
  const hasInjury = player.injuries?.length > 0 && player.status === "Blessé";
  const meta = STATUS_META[player.status] || STATUS_META.Disponible;

  return (
    <button onClick={() => onOpen(player.id)} className="player-card">
      <div className="player-card-top">
        <div className="player-avatar">{initials(player.firstName, player.lastName)}</div>
        <div className="player-number-wrap">
          <div className="player-number">{String(player.number).padStart(2, "0")}</div>
          <div className="player-number-label">numéro</div>
        </div>
      </div>
      <div className="player-name">{player.firstName} {player.lastName}</div>
      <div className="player-position">{player.position}</div>
      <div className="player-tags">
        <span className="division-tag">{division}</span>
        <StatusPill label={player.status} color={meta.color} bg={meta.bg} />
        {hasInjury && <ShieldAlert size={14} color={DANGER} />}
      </div>
      <div className="player-meta">
        <span className="player-meta-item"><Cake size={13} /> {age} ans</span>
        <span className="player-meta-item"><Ruler size={13} /> {player.heightCm} cm</span>
        <span className="player-meta-item"><HandMetal size={13} /> {player.hand}</span>
      </div>
    </button>
  );
}
