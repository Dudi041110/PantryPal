from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

SAVE_FILE = "player_data.json"

DEFAULT_DATA = {
    "equipped_ai": "Default",
    "points": 0,
    "owned": ["Default"],
    "redeemed_challenges": []
}

CHALLENGES = {
    "daily_cake": {
        "name": "Bake a Cake",
        "points": 150
    },

    "weekly_stirfry": {
        "name": "Cook a Stir Fry",
        "points": 250
    },

    "bonus_smoothie": {
        "name": "Make a Smoothie",
        "points": 100
    },

    "monthly_dinner": {
        "name": "Host a Dinner",
        "points": 600
    }
}

EXPIRY_DATA = {
    "Beef": 1,
    "Eggs": 3,
    "Butter": 7,
    "Milk": 2
}

def load_data():
    if not os.path.exists(SAVE_FILE):
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA

    with open(SAVE_FILE, "r") as file:
        data = json.load(file)

    for key, value in DEFAULT_DATA.items():
        if key not in data:
            data[key] = value

    return data

def save_data(data):
    with open(SAVE_FILE, "w") as file:
        json.dump(data, file, indent=4)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get_data")
def get_data():
    data = load_data()
    return jsonify(data)

@app.route("/save_data", methods=["POST"])
def save_player_data():
    old_data = load_data()
    new_data = request.json
    old_data.update(new_data)
    save_data(old_data)
    return jsonify({
        "status": "success"
    })

@app.route("/get_expiry")
def get_expiry():
    return jsonify(EXPIRY_DATA)

@app.route("/Challenge")
def challenge():
    return render_template("Challenge.html")

@app.route("/Challenge/get_data")
def get_data_challenge():
    data = load_data()
    return jsonify(data)

@app.route("/Challenge/save_data", methods=["POST"])
def load_data():
    if not os.path.exists(SAVE_FILE):
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA

    with open(SAVE_FILE, "r") as file:
        data = json.load(file)

    for key, value in DEFAULT_DATA.items():
        if key not in data:
            data[key] = value

    return data

@app.route("/Challenge/redeem/<challenge_id>", methods=["POST"])
def redeem_challenge(challenge_id):
    data = load_data()

    if "redeemed_challenges" not in data:
        data["redeemed_challenges"] = []

    if challenge_id not in CHALLENGES:
        return jsonify({
            "status": "error"
        }), 400

    if challenge_id in data["redeemed_challenges"]:
        return jsonify({
            "status": "already_redeemed"
        })

    reward = CHALLENGES[challenge_id]["points"]

    data["points"] += reward

    data["redeemed_challenges"].append(challenge_id)

    save_data(data)

    return jsonify({
        "status": "success",
        "points_added": reward,
        "new_total": data["points"],
        "redeemed_challenges": data["redeemed_challenges"]
    })

@app.route("/Expiry")
def expiry():
    return render_template("Expiry.html")

@app.route("/Shopping")
def shopping():
    return render_template("Shopping.html")
 
@app.route("/Shopping/get_list")
def get_shopping_list():
    data = load_data()
    raw = data.get("shopping_list", ["Bread", "Yogurt", "Chicken"])
    # Normalise: support both plain strings and dicts
    items = []
    for i, entry in enumerate(raw):
        if isinstance(entry, dict):
            items.append({"index": i, "name": entry["name"], "checked": entry.get("checked", False)})
        else:
            items.append({"index": i, "name": str(entry), "checked": False})
    return jsonify({"items": items})
 
@app.route("/Shopping/add_item", methods=["POST"])
def add_shopping_item():
    data = load_data()
    raw = data.get("shopping_list", [])
    new_item = {"name": request.json.get("name", ""), "checked": False}
    raw.append(new_item)
    data["shopping_list"] = raw
    save_data(data)
    return _list_response(raw)
 
@app.route("/Shopping/toggle_item", methods=["POST"])
def toggle_shopping_item():
    data = load_data()
    raw = data.get("shopping_list", [])
    index = request.json.get("index", -1)
    if 0 <= index < len(raw):
        item = raw[index]
        if isinstance(item, str):
            item = {"name": item, "checked": False}
        item["checked"] = not item.get("checked", False)
        raw[index] = item
    data["shopping_list"] = raw
    save_data(data)
    return _list_response(raw)
 
@app.route("/Shopping/delete_item", methods=["POST"])
def delete_shopping_item():
    data = load_data()
    raw = data.get("shopping_list", [])
    index = request.json.get("index", -1)
    if 0 <= index < len(raw):
        raw.pop(index)
    data["shopping_list"] = raw
    save_data(data)
    return _list_response(raw)
 
@app.route("/Shopping/clear_checked", methods=["POST"])
def clear_checked_items():
    data = load_data()
    raw = data.get("shopping_list", [])
    raw = [i for i in raw if not (isinstance(i, dict) and i.get("checked", False))]
    data["shopping_list"] = raw
    save_data(data)
    return _list_response(raw)
 
def _list_response(raw):
    items = []
    for i, entry in enumerate(raw):
        if isinstance(entry, dict):
            items.append({"index": i, "name": entry["name"], "checked": entry.get("checked", False)})
        else:
            items.append({"index": i, "name": str(entry), "checked": False})
    return jsonify({"items": items})

if __name__ == "__main__":
    app.run(debug=True)