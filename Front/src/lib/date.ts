export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function toISODate(d: Date | undefined): string {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(s: string): Date | undefined {
  if (!s) return undefined;
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(d?: string | null): string {
  if (!d) return "—";
  const parsed = fromISODate(d);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = fromISODate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d.getTime() > today.getTime();
}
