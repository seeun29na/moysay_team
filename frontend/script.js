const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const updateIntensity = (groupDiv, count) => {
  groupDiv.classList.remove("intensity-2", "intensity-3", "intensity-4", "intensity-5");
  if (count >= 29) groupDiv.classList.add("intensity-5");
  else if (count >= 20) groupDiv.classList.add("intensity-4");
  else if (count >= 10) groupDiv.classList.add("intensity-3");
  else if (count >= 5) groupDiv.classList.add("intensity-2");
};

const generateSlots = () => {
  const startHour = 9;
  const endHour = 22;
  const groupInterval = 30; // 30분 단위

  document.querySelectorAll(".time-slots").forEach((container) => {
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += groupInterval) {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add("slot-group");
        groupDiv.dataset.count = 0;

        const baseTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        groupDiv.dataset.start = baseTime;

        for (let i = 0; i < groupInterval; i++) {
          const minutes = m + i;
          const hh = String(h + Math.floor(minutes / 60)).padStart(2, '0');
          const mm = String(minutes % 60).padStart(2, '0');
          const time = `${hh}:${mm}`;

          const minuteSlot = document.createElement("div");
          minuteSlot.classList.add("minute-slot");
          minuteSlot.dataset.time = time;
          minuteSlot.dataset.count = 0;
          minuteSlot.dataset.tooltip = "";
          groupDiv.appendChild(minuteSlot);
        }

        const label = document.createElement("span");
        label.classList.add("time-label");
        label.textContent = baseTime;
        groupDiv.appendChild(label);

        container.appendChild(groupDiv);
      }
    }
  });
};

const populateTimeSelectors = () => {
  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    `<option value="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</option>`
  ).join('');

  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    `<option value="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</option>`
  ).join('');

  document.getElementById("startHour").innerHTML = hourOptions;
  document.getElementById("endHour").innerHTML = hourOptions;
  document.getElementById("startMinute").innerHTML = minuteOptions;
  document.getElementById("endMinute").innerHTML = minuteOptions;
};

document.addEventListener("DOMContentLoaded", () => {
  // localStorage에서 날짜, 모임 정보 가져오기
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const meetingInfo = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  const roomName = meetingInfo.name || 'default-room';

  // 날짜 선택 <select> 구성
  const dateSelect = document.getElementById('date');
  dateSelect.innerHTML = '';
  selectedDates.forEach(ds => {
    const [y, m, d] = ds.split('-');
    const opt = document.createElement('option');
    opt.value = ds;
    opt.textContent = `${parseInt(m)}/${parseInt(d)}`;
    dateSelect.appendChild(opt);
  });

  // 스케줄 컬럼 생성
  const scheduleEl = document.querySelector('.schedule');
  scheduleEl.innerHTML = '';
  selectedDates.forEach(ds => {
    const col = document.createElement('div');
    col.classList.add('day-column');
    col.dataset.date = ds;

    const [y, m, d] = ds.split('-');
    const label = document.createElement('div');
    label.classList.add('day-label');
    label.textContent = `${parseInt(m)}/${parseInt(d)}`;
    col.appendChild(label);

    const slotsDiv = document.createElement('div');
    slotsDiv.classList.add('time-slots');
    col.appendChild(slotsDiv);

    scheduleEl.appendChild(col);
  });

  // 시간 선택 드롭다운 채우기
  populateTimeSelectors();
  // 슬롯 생성
  generateSlots();

  // 모임 정보 패널 표시
  document.getElementById('meeting-name').textContent     = meetingInfo.name || '';
  document.getElementById('meeting-location').textContent = meetingInfo.location ? `장소: ${meetingInfo.location}` : '';
  if (meetingInfo.link) {
    const a = document.getElementById('meeting-link');
    a.href = meetingInfo.link;
    a.textContent = meetingInfo.link;
  }

  // Firebase Realtime Database 연동
  const db = window.firebaseDB;
  const { firebaseRef, firebasePush, firebaseOnValue } = window;
  const availRef = firebaseRef(db, `rooms/${roomName}/availabilities`);

  // 실시간 데이터 수신 및 화면 갱신
  firebaseOnValue(availRef, snapshot => {
    // 모든 슬롯 초기화
    document.querySelectorAll('.minute-slot').forEach(slot => {
      slot.classList.remove('busy-definite','busy-maybe');
      slot.dataset.count = 0;
      slot.dataset.tooltip = '';
    });
    document.querySelectorAll('.slot-group').forEach(group => {
      group.classList.remove('intensity-2','intensity-3','intensity-4','intensity-5');
      group.dataset.count = 0;
    });

    const data = snapshot.val() || {};
    Object.values(data).forEach(entry => {
      const { name, date, start, end, certainty } = entry;
      const startTime = toMinutes(start);
      const endTime = toMinutes(end);
      const slotGroups = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;
      for (let group of slotGroups) {
        const minuteSlots = group.querySelectorAll('.minute-slot');
        for (let slot of minuteSlots) {
          const slotMinutes = toMinutes(slot.dataset.time);
          if (slotMinutes >= startTime && slotMinutes < endTime) {
            slot.classList.add(certainty === 'definite' ? 'busy-definite' : 'busy-maybe');
            slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;
            let count = parseInt(slot.dataset.count || '0', 10) + 1;
            slot.dataset.count = count;

            let groupCount = parseInt(group.dataset.count || '0', 10) + 1;
            group.dataset.count = groupCount;
            updateIntensity(group, groupCount);
          }
        }
      }
    });
  });

  // 사용자 입력 저장
  document.getElementById("availabilityForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const date = document.getElementById("date").value;
    const certainty = document.getElementById("certainty").value;
    const start = `${document.getElementById("startHour").value}:${document.getElementById("startMinute").value}`;
    const end = `${document.getElementById("endHour").value}:${document.getElementById("endMinute").value}`;

    // Firebase에 데이터 푸시
    firebasePush(availRef, { name, date, start, end, certainty });
    e.target.reset();
  });
});
