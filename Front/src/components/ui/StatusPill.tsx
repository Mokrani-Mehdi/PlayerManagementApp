import { StatusDot } from "./StatusDot";

export function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="status-pill" style={{ background: bg, color }}>
      <StatusDot color={color} />
      {label}
    </span>
  );
}
