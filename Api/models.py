from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field

Status = str      # "Disponible" | "Blessé" | "En pause" | "Partagé"
Position = str
Hand = str        # "Gauche" | "Droite"
Severity = str    # "Légère" | "Modérée" | "Sévère"


class InjuryIn(BaseModel):
    description: str
    date: date
    severity: Severity = "Légère"
    duration_weeks: int = 0


class InjuryOut(InjuryIn):
    id: str
    player_id: str


class PlayerIn(BaseModel):
    first_name: str
    last_name: str
    number: int = 0
    dob: date
    status: Status = "Disponible"
    height_cm: int = 0
    parent_phone: str = ""
    phone_number: int = 0       
    position: Position = "Ailier Droit"
    hand: Hand = "Droite"
    notes: str = ""


class PlayerOut(PlayerIn):
    id: str
    injuries: List[InjuryOut] = Field(default_factory=list)


class DivisionRow(BaseModel):
    id: Optional[str] = None
    label: str
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    sort_order: int = 0


class DivisionsReplace(BaseModel):
    divisions: List[DivisionRow]