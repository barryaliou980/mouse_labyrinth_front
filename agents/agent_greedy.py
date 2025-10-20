from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn, random

app = FastAPI(title="Agent Glouton")

class Sense(BaseModel):
    turn: int
    me: dict
    neighbors: list   # [{dir:"N","S","E","W","free":bool}]
    cheeses: list     # [{x:int,y:int}]
    mice: list        # [{id:str,x:int,y:int}]

def manhattan(a, b): return abs(a["x"] - b["x"]) + abs(a["y"] - b["y"])

# mémoire courte par souris
MEM = {}  # mouse_id -> {"last_dir":str|None, "last_pos":(x,y)|None, "stuck":int, "mode":"greedy"|"wall", "wall_steps":int}

DIRS = ["N","E","S","W"]
RIGHT = {"N":"E","E":"S","S":"W","W":"N"}
LEFT  = {"N":"W","W":"S","S":"E","E":"N"}
BACK  = {"N":"S","S":"N","E":"W","W":"E"}

def infer_mouse_id(sense: Sense):
    # on identifie la souris courante par correspondance de position exacte
    for m in sense.mice:
        if m["x"] == sense.me["x"] and m["y"] == sense.me["y"]:
            return m["id"]
    return "__single__"  # fallback si une seule souris

def choose_greedy(sense: Sense, free):
    if not sense.cheeses:
        return "X"
    me = sense.me
    target = min(sense.cheeses, key=lambda c: manhattan(me, c))
    dx = target["x"] - me["x"]; dy = target["y"] - me["y"]

    # priorités pour réduire la distance manhattan
    candidates = []
    if abs(dx) >= abs(dy):
        candidates += (["E"] if dx > 0 else ["W"]) + (["S"] if dy > 0 else ["N"])
    else:
        candidates += (["S"] if dy > 0 else ["N"]) + (["E"] if dx > 0 else ["W"])

    # si rien ne réduit, autoriser directions qui ne l'augmentent pas trop (secours)
    for d in candidates:
        if d in free:
            return d
    # sinon, n'importe quelle direction libre (éviter de rester coincé)
    return random.choice(list(free)) if free else "X"

def choose_wall_follow(facing, free):
    # règle de la main droite: droite > tout droit > gauche > arrière
    for d in [RIGHT[facing], facing, LEFT[facing], BACK[facing]]:
        if d in free:
            return d
    return "X"

@app.post("/decide")
def decide(sense: Sense):
    mouse_id = infer_mouse_id(sense)
    st = MEM.setdefault(mouse_id, {"last_dir": None, "last_pos": None, "stuck": 0, "mode": "greedy", "wall_steps": 0})

    free = {n["dir"] for n in sense.neighbors if n.get("free")}
    # si aucune case libre, rester
    if not free:
        st["stuck"] += 1
        return {"direction": "X"}

    # détecter l'oscillation / blocage
    pos = (sense.me["x"], sense.me["y"])
    if st["last_pos"] == pos:
        st["stuck"] += 1
    else:
        st["stuck"] = max(0, st["stuck"] - 1)

    # éviter le demi-tour inutile (ping-pong)
    avoid = BACK[st["last_dir"]] if st["last_dir"] else None
    if avoid in free and len(free) > 1:
        free = {d for d in free if d != avoid}

    # passage en mode "wall" si coincé trop longtemps
    if st["mode"] == "greedy" and st["stuck"] >= 3:
        st["mode"] = "wall"
        st["wall_steps"] = 0
        if st["last_dir"] is None:
            st["last_dir"] = random.choice(["N","E","S","W"])

    # choix de direction
    if st["mode"] == "wall":
        d = choose_wall_follow(st["last_dir"] or "N", free)
        st["wall_steps"] += 1
        # après quelques pas, retourner au greedy
        if st["wall_steps"] >= 6:
            st["mode"] = "greedy"
            st["stuck"] = 0
    else:
        d = choose_greedy(sense, free)

    # mise à jour mémoire
    st["last_dir"] = d if d in DIRS else st["last_dir"]
    st["last_pos"] = pos

    return {"direction": d}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
