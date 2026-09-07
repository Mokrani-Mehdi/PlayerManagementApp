from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import supabase
from models import PlayerIn, PlayerOut, InjuryIn, InjuryOut, DivisionsReplace, DivisionRow

app = FastAPI(title="Roster API")

# The frontend (a Claude artifact / your own hosted page) calls this API
# straight from the browser, so CORS needs to allow that origin.
# "*" is the simplest option to get started; once you know the exact
# origin your app is served from, replace it with that origin for safety.
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
        # Ensure phone_number is None if empty
        if p.get("phone_number") == "" or p.get("phone_number") is None:
            p["phone_number"] = None
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