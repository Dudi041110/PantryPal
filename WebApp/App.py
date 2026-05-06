"""
PantryPal - Full Stack Flask App
Run: pip install flask && python app.py
"""

from flask import Flask, jsonify, request, render_template
from datetime import datetime, date
import sqlite3, os

app = Flask(__name__)
DB = "pantrypal.db"

# ─── DATABASE SETUP ───────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS points (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            amount    INTEGER NOT NULL,
            reason    TEXT NOT NULL,
            created   TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS expiry_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            expiry_date TEXT NOT NULL,
            created     TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS shopping_items (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            created   TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS recipes (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            title        TEXT NOT NULL,
            ingredients  TEXT NOT NULL,
            instructions TEXT NOT NULL,
            created      TEXT DEFAULT (datetime('now'))
        );
    """)
    # Seed some default recipes if empty
    count = db.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
    if count == 0:
        db.executemany("INSERT INTO recipes (title, ingredients, instructions) VALUES (?,?,?)", [
            ("Pasta Aglio e Olio",
             "Spaghetti, garlic, olive oil, chili flakes, parsley, salt",
             "1. Boil spaghetti until al dente.\n2. Fry sliced garlic in olive oil until golden.\n3. Add chili flakes, toss with pasta.\n4. Garnish with parsley and serve."),
            ("Avocado Toast",
             "Bread, avocado, lemon juice, salt, pepper, chili flakes",
             "1. Toast bread until golden.\n2. Mash avocado with lemon juice, salt and pepper.\n3. Spread on toast and top with chili flakes."),
            ("Veggie Omelette",
             "Eggs, bell pepper, onion, tomato, salt, pepper, butter",
             "1. Beat eggs with salt and pepper.\n2. Sauté diced vegetables in butter.\n3. Pour eggs over veggies, cook until set.\n4. Fold and serve hot."),
        ])
    db.commit()
    db.close()

# ─── SERVE APP ────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

# ════════════════════════════════════════
#  POINTS API
# ════════════════════════════════════════
@app.route("/api/points", methods=["GET"])
def get_points():
    db = get_db()
    rows = db.execute("SELECT * FROM points ORDER BY created DESC").fetchall()
    total = db.execute("SELECT COALESCE(SUM(amount),0) FROM points").fetchone()[0]
    db.close()
    return jsonify({
        "balance": total,
        "history": [dict(r) for r in rows]
    })

@app.route("/api/points", methods=["POST"])
def add_points():
    data = request.get_json()
    amount = int(data.get("amount", 0))
    reason = data.get("reason", "Manual entry")
    db = get_db()
    db.execute("INSERT INTO points (amount, reason) VALUES (?,?)", (amount, reason))
    db.commit()
    total = db.execute("SELECT COALESCE(SUM(amount),0) FROM points").fetchone()[0]
    db.close()
    return jsonify({"success": True, "balance": total})

# ════════════════════════════════════════
#  EXPIRY API
# ════════════════════════════════════════
@app.route("/api/expiry", methods=["GET"])
def get_expiry():
    db = get_db()
    rows = db.execute("SELECT * FROM expiry_items ORDER BY expiry_date ASC").fetchall()
    db.close()
    today = date.today().isoformat()
    items = []
    for r in rows:
        item = dict(r)
        delta = (date.fromisoformat(r["expiry_date"]) - date.today()).days
        item["days_left"] = delta
        if delta < 0:
            item["status"] = "expired"
        elif delta <= 2:
            item["status"] = "critical"
        elif delta <= 5:
            item["status"] = "warning"
        else:
            item["status"] = "ok"
        items.append(item)
    return jsonify(items)

@app.route("/api/expiry", methods=["POST"])
def add_expiry():
    data = request.get_json()
    name = data.get("name", "").strip()
    expiry = data.get("expiry_date", "")
    if not name or not expiry:
        return jsonify({"error": "Name and expiry_date required"}), 400
    db = get_db()
    db.execute("INSERT INTO expiry_items (name, expiry_date) VALUES (?,?)", (name, expiry))
    db.commit()
    db.close()
    return jsonify({"success": True})

@app.route("/api/expiry/<int:item_id>", methods=["DELETE"])
def delete_expiry(item_id):
    db = get_db()
    db.execute("DELETE FROM expiry_items WHERE id=?", (item_id,))
    db.commit()
    db.close()
    return jsonify({"success": True})

# ════════════════════════════════════════
#  SHOPPING LIST API
# ════════════════════════════════════════
@app.route("/api/shopping", methods=["GET"])
def get_shopping():
    db = get_db()
    rows = db.execute("SELECT * FROM shopping_items ORDER BY completed ASC, created DESC").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/shopping", methods=["POST"])
def add_shopping():
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name required"}), 400
    db = get_db()
    db.execute("INSERT INTO shopping_items (name) VALUES (?)", (name,))
    db.commit()
    db.close()
    return jsonify({"success": True})

@app.route("/api/shopping/<int:item_id>", methods=["PATCH"])
def toggle_shopping(item_id):
    db = get_db()
    db.execute("UPDATE shopping_items SET completed = 1 - completed WHERE id=?", (item_id,))
    db.commit()
    db.close()
    return jsonify({"success": True})

@app.route("/api/shopping/<int:item_id>", methods=["DELETE"])
def delete_shopping(item_id):
    db = get_db()
    db.execute("DELETE FROM shopping_items WHERE id=?", (item_id,))
    db.commit()
    db.close()
    return jsonify({"success": True})

# ════════════════════════════════════════
#  RECIPES API
# ════════════════════════════════════════
@app.route("/api/recipes", methods=["GET"])
def get_recipes():
    db = get_db()
    rows = db.execute("SELECT * FROM recipes ORDER BY created DESC").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/recipes", methods=["POST"])
def add_recipe():
    data = request.get_json()
    title        = data.get("title", "").strip()
    ingredients  = data.get("ingredients", "").strip()
    instructions = data.get("instructions", "").strip()
    if not title or not ingredients or not instructions:
        return jsonify({"error": "All fields required"}), 400
    db = get_db()
    db.execute("INSERT INTO recipes (title, ingredients, instructions) VALUES (?,?,?)",
               (title, ingredients, instructions))
    db.commit()
    db.close()
    return jsonify({"success": True})

@app.route("/api/recipes/<int:recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    db = get_db()
    db.execute("DELETE FROM recipes WHERE id=?", (recipe_id,))
    db.commit()
    db.close()
    return jsonify({"success": True})

# ─── RUN ──────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)