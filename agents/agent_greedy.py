from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
app=FastAPI(title='Agent Glouton')
class Sense(BaseModel):
    turn:int; me:dict; neighbors:list; cheeses:list; mice:list
def manhattan(a,b): return abs(a['x']-b['x'])+abs(a['y']-b['y'])
@app.post('/decide')
def decide(sense: Sense):
    if not sense.cheeses: return {'direction':'X'}
    me=sense.me; target=min(sense.cheeses,key=lambda c: manhattan(me,c))
    dx=target['x']-me['x']; dy=target['y']-me['y']
    candidates=[]
    if abs(dx)>=abs(dy): candidates+=(['E'] if dx>0 else ['W'])+(['S'] if dy>0 else ['N'])
    else: candidates+=(['S'] if dy>0 else ['N'])+(['E'] if dx>0 else ['W'])
    free={n['dir'] for n in sense.neighbors if n.get('free')}
    for d in candidates:
        if d in free: return {'direction': d}
    return {'direction':'X'}
if __name__=='__main__': uvicorn.run(app,host='0.0.0.0',port=8003)
