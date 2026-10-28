import "./SummaryTile.css";

export function SummaryTile({ label, value, color, bg }: {
  label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="summary-tile" style={{ background: bg, borderColor: color + "33" }}>
      <div className="summary-tile-value" style={{ color }}>{value}</div>
      <div className="summary-tile-label">{label}</div>
    </div>
  );
}
