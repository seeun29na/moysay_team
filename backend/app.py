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
