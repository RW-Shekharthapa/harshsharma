import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/db")
def db():
    import pymysql, urllib.parse as u
    p = u.urlparse(os.environ["DATABASE_URL"])
    try:
        pymysql.connect(host=p.hostname, port=p.port, user=p.username, password=p.password, database=p.path[1:], connect_timeout=3).close()
        return {"db": "ok"}
    except Exception as e:
        return JSONResponse({"db": "error", "message": str(e)}, status_code=503)

