export type Status = "Disponible" | "Blessé" | "En pause" | "En prêt";
export type Position =
  | "Gardien" | "Ailier Gauche" | "Ailier Droit"
  | "Arrière Gauche" | "Arrière Droit" | "Demi-centre" | "Pivot";
export type Hand = "Gauche" | "Droite" | "Ambidextre";
export type Severity = "Légère" | "Modérée" | "Sévère";
export type SortKey = "number" | "name" | "age" | "height";
export type DrawerMode = "view" | "create" | null;
export type AppTab = "joueurs" | "entrainements" | "matchs";

export interface Injury {
  id: string;
  description: string;
  date: string;
  severity: Severity;
  durationWeeks: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  dob: string;
  status: Status;
  heightCm: number;
  parentPhone: string;
  phoneNumber: string;
  position: Position;
  hand: Hand;
  notes: string;
  injuries: Injury[];
}

export interface EnrichedPlayer extends Player {
  division: string;
  age: number | null;
}

export interface DivisionConfig {
  id: string;
  label: string;
  minYear: number | null;
  maxYear: number | null;
}

export interface PlayerForm extends Omit<Player, "id" | "number" | "heightCm"> {
  id: string | null;
  number: number | string;
  heightCm: number | string;
}

export interface NewInjuryForm {
  description: string;
  date: string;
  severity: Severity;
  durationWeeks: number | string;
}
