print("🔥 THIS IS THE CORRECT APP.PY 🔥")

from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS
from flask import render_template

app = Flask(__name__)

# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Load model + scaler
model = joblib.load("nafld_api/nafld_model.pkl")
scaler = joblib.load("nafld_api/scaler.pkl")

@app.route("/")
def home():
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/phase1")
def phase1():
    return render_template("phase1.html")

@app.route("/patient-detail")
def patient_detail():
    return render_template("patient-detail.html")

@app.route("/predict_phase1", methods=["POST", "GET", "OPTIONS"])
def predict_phase1():

    # OPTIONS → CORS preflight
    if request.method == "OPTIONS":
        resp = jsonify({"msg": "CORS OK"})
        resp.headers.add("Access-Control-Allow-Origin", "*")
        resp.headers.add("Access-Control-Allow-Headers", "*")
        resp.headers.add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        return resp, 200

    # GET → Quick test
    if request.method == "GET":
        return jsonify({"message": "predict_phase1 route is working!"}), 200

    # POST → Real prediction
    data = request.json

    # -------------------------------
    # Convert gender to numeric
    # -------------------------------
    gender = 1 if data["gender"] == "Male" else 0

    # -------------------------------
    # Build feature array (11 features)
    # SAME ORDER AS TRAINING MODEL
    # -------------------------------
    X = np.array([[
        data["age"],              # 1 Age
        gender,                   # 2 Gender
        data["totalBilirubin"],   # 3 Total_Bilirubin
        data["directBilirubin"],  # 4 Direct_Bilirubin
        data["alp"],              # 5 ALP
        data["alt"],              # 6 ALT
        data["ast"],              # 7 AST
        data["totalProtein"],     # 8 Total_Proteins
        data["albumin"],          # 9 Albumin
        data["agRatio"],          # 10 A/G Ratio
        data["fib4"]              # 11 FIB4
    ]])

    # Scale
    X_scaled = scaler.transform(X)

    # Predict NAFLD
    nafld_pred = model.predict(X_scaled)[0]
    nafld_label = "Present" if nafld_pred == 1 else "Absent"

    # Simple risk logic using AST
       # Compute risk from FIB4
    fib4 = data["fib4"]

    if fib4 < 1.3:
        risk = "Low"
    elif fib4 < 2.67:
        risk = "Medium"
    else:
        risk = "High"

    return jsonify({
        "nafld": nafld_label,
        "risk": risk
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
