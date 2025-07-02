# 📁 backend/app.py
from flask import Flask
from routes.schedule_routes import schedule_bp

app = Flask(__name__)
app.register_blueprint(schedule_bp)

@app.route("/")
def home():
    return "🕊️ 모이새 서버 실행 중!"

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

# # backend/app.py
# from flask import Flask, request, jsonify
# import json
# import os

# app = Flask(__name__)

# DATA_FILE = "data/schedule.json"

# # 기본 루트 페이지
# @app.route("/")
# def home():
#     return "🕊️ 모이새 서버 실행 중!"

# # 일정 저장 API
# @app.route("/submit", methods=["POST"])
# def submit():
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No data received"}), 400

#     # 기존 데이터 불러오기
#     if os.path.exists(DATA_FILE):
#         with open(DATA_FILE, "r", encoding="utf-8") as f:
#             schedule_data = json.load(f)
#     else:
#         schedule_data = []

#     schedule_data.append(data)

#     # 저장
#     with open(DATA_FILE, "w", encoding="utf-8") as f:
#         json.dump(schedule_data, f, ensure_ascii=False, indent=2)

#     return jsonify({"message": "저장 완료!", "data": data}), 200

# # 일정 조회 API
# @app.route("/schedules", methods=["GET"])
# def get_schedules():
#     if os.path.exists(DATA_FILE):
#         with open(DATA_FILE, "r", encoding="utf-8") as f:
#             schedule_data = json.load(f)
#     else:
#         schedule_data = []

#     return jsonify(schedule_data), 200

# if __name__ == "__main__":
#     app.run(debug=True)
