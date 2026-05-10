from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

SAVE_FILE = "player_data.json"

DEFAULT_DATA = {
    "equipped_ai": "Default",
    "points": 0,
    "owned": ["Default"]
}

def load_data():
    if not os.path.exists(SAVE_FILE):
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA
    with open(SAVE_FILE, "r") as file:
        return json.load(file)

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
    data = request.json
    save_data(data)
    return jsonify({
        "status": "success"
    })

if __name__ == "__main__":
    app.run(debug=True)