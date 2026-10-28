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
    parent_phone: Optional[str] = None
    phone_number: Optional[str] = None
    position: Position = "Ailier Droit"
    hand: Hand = "Droite"
    notes: Optional[str] = None


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


# ---------------------------------------------------------
# Trainings
# ---------------------------------------------------------
TrainingAttendanceStatus = str  # "Présent" | "Absent" | "Excusé" | "Blessé"


class TrainingAttendanceIn(BaseModel):
    player_id: str
    status: TrainingAttendanceStatus = "Présent"
    absence_reason: str = ""
    shots_made: int = 0
    shots_attempted: int = 0
    pass_pct: Optional[float] = None
    rating: Optional[float] = None


class TrainingAttendanceOut(TrainingAttendanceIn):
    id: str
    training_id: str


class TrainingIn(BaseModel):
    date: date
    theme: str
    division: str = ""
    location: str = ""
    notes: str = ""


class TrainingOut(TrainingIn):
    id: str
    attendance: List[TrainingAttendanceOut] = Field(default_factory=list)


class TrainingAttendanceBulk(BaseModel):
    rows: List[TrainingAttendanceIn]


# ---------------------------------------------------------
# Matches
# ---------------------------------------------------------
MatchPlayerStatus = str  # "A joué" | "Banc" | "Blessé" | "Non convoqué"


class MatchPlayerIn(BaseModel):
    player_id: str
    status: MatchPlayerStatus = "A joué"
    detail: str = ""
    minutes: int = 0
    goals: int = 0
    saves: int = 0
    two_min: int = 0


class MatchPlayerOut(MatchPlayerIn):
    id: str
    match_id: str


class MatchIn(BaseModel):
    date: date
    opponent: str
    home_away: str = "Domicile"
    competition: str = ""
    score_for: int = 0
    score_against: int = 0
    notes: str = ""


class MatchOut(MatchIn):
    id: str
    players: List[MatchPlayerOut] = Field(default_factory=list)


class MatchPlayerBulk(BaseModel):
    rows: List[MatchPlayerIn]
