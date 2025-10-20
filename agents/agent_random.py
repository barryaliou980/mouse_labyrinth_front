from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn, random
app=FastAPI(title='Agent Aléatoire')
class Sense(BaseModel):
    turn:int; me:dict; neighbors:list; cheeses:list; mice:list
@app.post('/decide')
def decide(sense: Sense):
    dirs=['N','S','E','W','X']
    free=[n['dir'] for n in sense.neighbors if n.get('free')]
    import random
    return {'direction': random.choice(free or dirs)}
if __name__=='__main__': uvicorn.run(app,host='0.0.0.0',port=8001)
