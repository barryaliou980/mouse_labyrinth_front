from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn, random
app=FastAPI(title='Agent Tout Droit')
class Sense(BaseModel):
    turn:int; me:dict; neighbors:list; cheeses:list; mice:list
current_dir=random.choice(['N','S','E','W'])
@app.post('/decide')
def decide(sense: Sense):
    global current_dir
    free = {n['dir'] for n in sense.neighbors if n.get('free')}
    if current_dir not in free:
        current_dir = random.choice(list(free) or ['X'])
    return {'direction': current_dir}
if __name__=='__main__': uvicorn.run(app,host='0.0.0.0',port=8002)
