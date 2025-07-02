# 📁 backend/routes/schedule_routes.py
from flask import Blueprint, request, jsonify
from services.schedule_logic import save_schedule, get_common_times
from services.file_io import load_data, write_data

schedule_bp = Blueprint("schedule", __name__)

# 사용자 시간 제출
@schedule_bp.route("/submit", methods=["POST"])
def submit():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received"}), 400

    schedule_data = load_data()
    schedule_data = [u for u in schedule_data if u.get("nickname") != data.get("nickname")]
    schedule_data.append(data)
    write_data(schedule_data)

    return jsonify({"message": "저장 완료!", "data": data}), 200

# 겹치는 시간 조회
@schedule_bp.route("/common", methods=["GET"])
def common():
    schedule_data = load_data()
    return jsonify(get_common_times(schedule_data))

# 전체 일정 조회
@schedule_bp.route("/schedules", methods=["GET"])
def get_schedules():
    schedule_data = load_data()
    return jsonify(schedule_data), 200