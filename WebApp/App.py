from flask import Flask, render_template, jsonify

Customizable_AI_Skins = ["Cat", "Top", "Chef", "Robo", "Default"]
Equipped_AI = Customizable_AI_Skins[4]


app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get_result")
def send_result():
    return jsonify({"result": Equipped_AI})

if __name__ == "__main__":
    app.run(debug=True)