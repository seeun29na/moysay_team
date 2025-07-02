# 📁 backend/services/schedule_logic.py
def save_schedule(data):
    from services.file_io import load_data, write_data
    schedule_data = load_data()
    schedule_data = [u for u in schedule_data if u.get("nickname") != data.get("nickname")]
    schedule_data.append(data)
    write_data(schedule_data)


def get_common_times(schedules):
    common = {}
    for entry in schedules:
        for date, times in entry.get("times", {}).items():
            if isinstance(times, dict):
                slots = times.get("certain", [])
            else:
                slots = times

            if date not in common:
                common[date] = set(slots)
            else:
                common[date] &= set(slots)
    return {date: sorted(list(times)) for date, times in common.items()}