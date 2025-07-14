// 유틸 함수들
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// 그룹별 강도(intensity) 업데이트 (definite vs maybe)
const updateIntensity = (groupDiv, countDefinite, countMaybe) => {
  groupDiv.classList.remove(
    "intensity-definite-1", "intensity-definite-2", "intensity-definite-3", "intensity-definite-4",
    "intensity-maybe-1",    "intensity-maybe-2",    "intensity-maybe-3",    "intensity-maybe-4"
  );

  const isDefiniteDominant = countDefinite >= countMaybe;
  const maxCount = Math.max(countDefinite, countMaybe);
  let level = 0;
  if (maxCount >= 20) level = 4;
  else if (maxCount >= 10) level = 3;
  else if (maxCount >= 5) level = 2;
  else if (maxCount > 0) level = 1;

  if (level > 0) {
    const prefix = isDefiniteDominant ? "intensity-definite-" : "intensity-maybe-";
    groupDiv.classList.add(`${prefix}${level}`);
  }
};

// 시간 슬롯 생성 (meetingInfo.time 반영 가능)
const generateSlots = () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 9, endHour = 22;

  if (info.time && info.time.includes('~')) {
    const [start, end] = info.time.split('~').map(s => parseInt(s.trim(), 10));
    if (!isNaN(start)) startHour = start;
    if (!isNaN(end))   endHour = end;
  }

  const groupInterval = 30;
  document.querySelectorAll('.time-slots').forEach(container => {
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += groupInterval) {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('slot-group');
        groupDiv.dataset.definite = 0;
        groupDiv.dataset.maybe = 0;

        const baseTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        groupDiv.dataset.start = baseTime;

        for (let i = 0; i < groupInterval; i++) {
          const minutes = m + i;
          const hh = String(h + Math.floor(minutes/60)).padStart(2,'0');
          const mm = String(minutes % 60).padStart(2,'0');
          const time = `${hh}:${mm}`;

          const minuteSlot = document.createElement('div');
          minuteSlot.classList.add('minute-slot');
          minuteSlot.dataset.time = time;
          minuteSlot.dataset.tooltip = '';
          groupDiv.appendChild(minuteSlot);
        }

        const label = document.createElement('span');
        label.classList.add('time-label');
        label.textContent = baseTime;
        groupDiv.appendChild(label);

        container.appendChild(groupDiv);
      }
    }
  });
};

// 시/분 선택 드롭다운 채우기
const populateTimeSelectors = () => {
  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    `<option value="${i.toString().padStart(2,'0')}">${i.toString().padStart(2,'0')}</option>`
  ).join('');
  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    `<option value="${i.toString().padStart(2,'0')}">${i.toString().padStart(2,'0')}</option>`
  ).join('');

  document.getElementById('startHour').innerHTML  = hourOptions;
  document.getElementById('endHour').innerHTML    = hourOptions;
  document.getElementById('startMinute').innerHTML = minuteOptions;
  document.getElementById('endMinute').innerHTML   = minuteOptions;
};

// 메인 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const meetingInfo = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  const roomName = meetingInfo.name || 'default-room';

  // 날짜 선택 박스 채우기
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

  // 시간 선택 셀렉터 & 슬롯 생성
  populateTimeSelectors();
  generateSlots();

  // Firebase Realtime Database 연동
  const db = window.firebaseDB;
  const { firebaseRef, firebasePush, firebaseOnValue } = window;
  const availRef = firebaseRef(db, `rooms/${roomName}/availabilities`);

  // 실시간 데이터 수신 및 화면 갱신
  firebaseOnValue(availRef, snapshot => {
    // 초기화
    document.querySelectorAll('.minute-slot').forEach(slot => {
      slot.classList.remove('busy-definite', 'busy-maybe');
      slot.dataset.tooltip = '';
    });
    document.querySelectorAll('.slot-group').forEach(group => {
      group.classList.remove(
        'intensity-definite-1','intensity-definite-2','intensity-definite-3','intensity-definite-4',
        'intensity-maybe-1','intensity-maybe-2','intensity-maybe-3','intensity-maybe-4'
      );
      group.dataset.definite = 0;
      group.dataset.maybe = 0;
    });

    const data = snapshot.val() || {};
    Object.values(data).forEach(entry => {
      const { name, date, start, end, certainty } = entry;
      const startTime = toMinutes(start);
      const endTime = toMinutes(end);
      const slotGroups = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;
      for (let group of slotGroups) {
        let defCount = 0, mayCount = 0;
        const minuteSlots = group.querySelectorAll('.minute-slot');
        for (let slot of minuteSlots) {
          const slotMin = toMinutes(slot.dataset.time);
          if (slotMin >= startTime && slotMin < endTime) {
            slot.classList.add(certainty === 'definite' ? 'busy-definite' : 'busy-maybe');
            slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;
            if (certainty === 'definite') defCount++; else mayCount++;
          }
        }
        group.dataset.definite = defCount;
        group.dataset.maybe = mayCount;
        updateIntensity(group, defCount, mayCount);
      }
    });
  });

  // 사용자 입력 저장
  document.getElementById('availabilityForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const date = document.getElementById('date').value;
    const certainty = document.getElementById('certainty').value;
    const start = `${document.getElementById('startHour').value}:${document.getElementById('startMinute').value}`;
    const end = `${document.getElementById('endHour').value}:${document.getElementById('endMinute').value}`;
    firebasePush(availRef, { name, date, start, end, certainty });
    e.target.reset();
  });

  // 모임 정보 패널 표시
  document.getElementById('meeting-name').textContent = meetingInfo.name || '';
  document.getElementById('meeting-location').textContent = meetingInfo.location ? `장소: ${meetingInfo.location}` : '';
  if (meetingInfo.link) {
    const a = document.getElementById('meeting-link');
    a.href = meetingInfo.link;
    a.textContent = meetingInfo.link;
  }
});

// thirdpage용 스크립트 (페이지 로드 시 meetingInfo 적용)
window.addEventListener('DOMContentLoaded', () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo'));
  const title = document.getElementById('meeting-title');
  if (info && info.name) title.textContent = info.name;
});


