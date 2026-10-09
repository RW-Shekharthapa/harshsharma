import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
import pymysql
import urllib.parse as u
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn():
    p = u.urlparse(os.environ["DATABASE_URL"])
    return pymysql.connect(
        host=p.hostname,
        port=p.port,
        user=p.username,
        password=p.password,
        database=p.path[1:],
        cursorclass=pymysql.cursors.DictCursor,
    )


def init_db():
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS clothes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                size VARCHAR(20) NOT NULL,
                color VARCHAR(50) NOT NULL,
                quantity INT NOT NULL DEFAULT 0,
                price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.commit()
    conn.close()


init_db()


class ClothItem(BaseModel):
    name: str
    category: str
    size: str
    color: str
    quantity: int
    price: float


class ClothItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/db")
def db():
    try:
        conn = get_conn()
        conn.close()
        return {"db": "ok"}
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse({"db": "error", "message": str(e)}, status_code=503)


@app.get("/api/clothes")
def list_clothes():
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM clothes ORDER BY created_at DESC")
        items = cur.fetchall()
    conn.close()
    return items


@app.post("/api/clothes", status_code=201)
def create_cloth(item: ClothItem):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO clothes (name, category, size, color, quantity, price) VALUES (%s, %s, %s, %s, %s, %s)",
            (item.name, item.category, item.size, item.color, item.quantity, item.price),
        )
        item_id = cur.lastrowid
        conn.commit()
        cur.execute("SELECT * FROM clothes WHERE id = %s", (item_id,))
        new_item = cur.fetchone()
    conn.close()
    return new_item


@app.put("/api/clothes/{item_id}")
def update_cloth(item_id: int, item: ClothItemUpdate):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM clothes WHERE id = %s", (item_id,))
        if not cur.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Item not found")
        fields = {k: v for k, v in item.dict().items() if v is not None}
        if fields:
            set_clause = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE clothes SET {set_clause} WHERE id = %s",
                (*fields.values(), item_id),
            )
            conn.commit()
        cur.execute("SELECT * FROM clothes WHERE id = %s", (item_id,))
        updated = cur.fetchone()
    conn.close()
    return updated


@app.delete("/api/clothes/{item_id}")
def delete_cloth(item_id: int):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM clothes WHERE id = %s", (item_id,))
        if not cur.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Item not found")
        cur.execute("DELETE FROM clothes WHERE id = %s", (item_id,))
        conn.commit()
    conn.close()
    return {"message": "Deleted successfully"}
