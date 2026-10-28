from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import supabase
from models import (
    PlayerIn, PlayerOut, InjuryIn, InjuryOut, DivisionsReplace, DivisionRow,
    TrainingIn, TrainingOut, TrainingAttendanceIn, TrainingAttendanceOut, TrainingAttendanceBulk,
    MatchIn, MatchOut, MatchPlayerIn, MatchPlayerOut, MatchPlayerBulk,
)

app = FastAPI(title="Roster API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------
# Players
# ---------------------------------------------------------
@app.get("/players", response_model=list[PlayerOut])
def list_players():
    players = supabase.table("players").select("*").order("number").execute().data
    injuries = supabase.table("injuries").select("*").order("date", desc=True).execute().data

    by_player = {}
    for inj in injuries:
        by_player.setdefault(inj["player_id"], []).append(inj)

    for p in players:
        p["injuries"] = by_player.get(p["id"], [])
    return players


@app.post("/players", response_model=PlayerOut)
def create_player(player: PlayerIn):
    data = player.model_dump(mode="json")
    res = supabase.table("players").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Could not create player")
    created = res.data[0]
    created["injuries"] = []
    return created


@app.put("/players/{player_id}", response_model=PlayerOut)
def update_player(player_id: str, player: PlayerIn):
    data = player.model_dump(mode="json")
    res = supabase.table("players").update(data).eq("id", player_id).execute()
    if not res.data:
        raise HTTPException(404, "Player not found")
    updated = res.data[0]
    injuries = supabase.table("injuries").select("*").eq("player_id", player_id).order("date", desc=True).execute().data
    updated["injuries"] = injuries
    return updated


@app.delete("/players/{player_id}")
def delete_player(player_id: str):
    # Delete injuries first to avoid orphaned rows if the DB has no CASCADE rule
    supabase.table("injuries").delete().eq("player_id", player_id).execute()
    supabase.table("players").delete().eq("id", player_id).execute()
    return {"deleted": player_id}


# ---------------------------------------------------------
# Injuries
# ---------------------------------------------------------
@app.post("/players/{player_id}/injuries", response_model=InjuryOut)
def add_injury(player_id: str, injury: InjuryIn):
    exists = supabase.table("players").select("id").eq("id", player_id).execute().data
    if not exists:
        raise HTTPException(404, "Player not found")
    data = injury.model_dump(mode="json")
    data["player_id"] = player_id
    res = supabase.table("injuries").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Could not add injury")
    return res.data[0]


@app.delete("/injuries/{injury_id}")
def delete_injury(injury_id: str):
    supabase.table("injuries").delete().eq("id", injury_id).execute()
    return {"deleted": injury_id}


# ---------------------------------------------------------
# Division config (age categories) — replaced as a whole set,
# since it's small and edited rarely (once a season).
# ---------------------------------------------------------
@app.get("/divisions", response_model=list[DivisionRow])
def list_divisions():
    return supabase.table("division_config").select("*").order("sort_order").execute().data


@app.put("/divisions", response_model=list[DivisionRow])
def replace_divisions(payload: DivisionsReplace):
    supabase.table("division_config").delete().neq("label", "__none__").execute()
    rows = [
        {
            "label": d.label,
            "min_year": d.min_year,
            "max_year": d.max_year,
            "sort_order": i,
        }
        for i, d in enumerate(payload.divisions)
    ]
    res = supabase.table("division_config").insert(rows).execute()
    return res.data


# ---------------------------------------------------------
# Trainings
# ---------------------------------------------------------
@app.get("/trainings", response_model=list[TrainingOut])
def list_trainings():
    trainings = supabase.table("trainings").select("*").order("date", desc=True).execute().data
    attendance = supabase.table("training_attendance").select("*").execute().data

    by_training = {}
    for row in attendance:
        by_training.setdefault(row["training_id"], []).append(row)

    for t in trainings:
        t["attendance"] = by_training.get(t["id"], [])
    return trainings


@app.post("/trainings", response_model=TrainingOut)
def create_training(training: TrainingIn):
    data = training.model_dump(mode="json")
    res = supabase.table("trainings").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Could not create training")
    created = res.data[0]
    created["attendance"] = []
    return created


@app.get("/trainings/{training_id}", response_model=TrainingOut)
def get_training(training_id: str):
    res = supabase.table("trainings").select("*").eq("id", training_id).execute()
    if not res.data:
        raise HTTPException(404, "Training not found")
    training = res.data[0]
    attendance = supabase.table("training_attendance").select("*").eq("training_id", training_id).execute().data
    training["attendance"] = attendance
    return training


@app.put("/trainings/{training_id}", response_model=TrainingOut)
def update_training(training_id: str, training: TrainingIn):
    data = training.model_dump(mode="json")
    res = supabase.table("trainings").update(data).eq("id", training_id).execute()
    if not res.data:
        raise HTTPException(404, "Training not found")
    updated = res.data[0]
    attendance = supabase.table("training_attendance").select("*").eq("training_id", training_id).execute().data
    updated["attendance"] = attendance
    return updated


@app.delete("/trainings/{training_id}")
def delete_training(training_id: str):
    supabase.table("training_attendance").delete().eq("training_id", training_id).execute()
    supabase.table("trainings").delete().eq("id", training_id).execute()
    return {"deleted": training_id}


@app.post("/trainings/{training_id}/attendance/bulk", response_model=list[TrainingAttendanceOut])
def bulk_upsert_training_attendance(training_id: str, payload: TrainingAttendanceBulk):
    exists = supabase.table("trainings").select("id").eq("id", training_id).execute().data
    if not exists:
        raise HTTPException(404, "Training not found")
    supabase.table("training_attendance").delete().eq("training_id", training_id).execute()
    if not payload.rows:
        return []
    rows = [{"training_id": training_id, **r.model_dump(mode="json")} for r in payload.rows]
    res = supabase.table("training_attendance").insert(rows).execute()
    if not res.data:
        raise HTTPException(500, "Could not insert attendance rows")
    return res.data


# ---------------------------------------------------------
# Matches
# ---------------------------------------------------------
@app.get("/matches", response_model=list[MatchOut])
def list_matches():
    matches = supabase.table("matches").select("*").order("date", desc=True).execute().data
    players = supabase.table("match_players").select("*").execute().data

    by_match = {}
    for row in players:
        by_match.setdefault(row["match_id"], []).append(row)

    for m in matches:
        m["players"] = by_match.get(m["id"], [])
    return matches


@app.post("/matches", response_model=MatchOut)
def create_match(match: MatchIn):
    data = match.model_dump(mode="json")
    res = supabase.table("matches").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Could not create match")
    created = res.data[0]
    created["players"] = []
    return created


@app.get("/matches/{match_id}", response_model=MatchOut)
def get_match(match_id: str):
    res = supabase.table("matches").select("*").eq("id", match_id).execute()
    if not res.data:
        raise HTTPException(404, "Match not found")
    match = res.data[0]
    players = supabase.table("match_players").select("*").eq("match_id", match_id).execute().data
    match["players"] = players
    return match


@app.put("/matches/{match_id}", response_model=MatchOut)
def update_match(match_id: str, match: MatchIn):
    data = match.model_dump(mode="json")
    res = supabase.table("matches").update(data).eq("id", match_id).execute()
    if not res.data:
        raise HTTPException(404, "Match not found")
    updated = res.data[0]
    players = supabase.table("match_players").select("*").eq("match_id", match_id).execute().data
    updated["players"] = players
    return updated


@app.delete("/matches/{match_id}")
def delete_match(match_id: str):
    supabase.table("match_players").delete().eq("match_id", match_id).execute()
    supabase.table("matches").delete().eq("id", match_id).execute()
    return {"deleted": match_id}


@app.post("/matches/{match_id}/players/bulk", response_model=list[MatchPlayerOut])
def bulk_upsert_match_players(match_id: str, payload: MatchPlayerBulk):
    exists = supabase.table("matches").select("id").eq("id", match_id).execute().data
    if not exists:
        raise HTTPException(404, "Match not found")
    supabase.table("match_players").delete().eq("match_id", match_id).execute()
    if not payload.rows:
        return []
    rows = [{"match_id": match_id, **r.model_dump(mode="json")} for r in payload.rows]
    res = supabase.table("match_players").insert(rows).execute()
    if not res.data:
        raise HTTPException(500, "Could not insert match player rows")
    return res.data
