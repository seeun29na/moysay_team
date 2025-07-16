// 유틸 함수
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// 시간 슬롯 생성
const generateSlots = () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 9, endHour = 22;

  if (info.time && (info.time.includes('~') || info.time.includes('-'))) {
    // ~ 또는 - 로 나눌 수 있도록 정규표현식 사용
    const [start, end] = info.time.split(/[-~]/).map(s => parseInt(s.trim(), 10));
    if (!isNaN(start)) startHour = start;
    if (!isNaN(end))   endHour = end;
  }

  const groupInterval = 30;
  document.querySelectorAll('.time-slots').forEach(container => {
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += groupInterval) {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('slot-group');
        const baseTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        groupDiv.dataset.start = baseTime;

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
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 0, endHour = 23;

  if (info.time && info.time.includes('~')) {
    const [start, end] = info.time.split('~').map(s => parseInt(s.trim(), 10));
    if (!isNaN(start)) startHour = start;
    if (!isNaN(end))   endHour = end;
  }

  const hourOptions = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const hour = (startHour + i).toString().padStart(2, '0');
    return `<option value="${hour}">${hour}</option>`;
  }).join('');

  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    `<option value="${i.toString().padStart(2,'0')}">${i.toString().padStart(2,'0')}</option>`
  ).join('');

  document.getElementById('startHour').innerHTML  = hourOptions;
  document.getElementById('endHour').innerHTML    = hourOptions;
  document.getElementById('startMinute').innerHTML = minuteOptions;
  document.getElementById('endMinute').innerHTML   = minuteOptions;
};

// 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const meetingInfo = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  const roomName = meetingInfo.name || 'default-room';

  const dateSelect = document.getElementById('date');
  dateSelect.innerHTML = '';
  selectedDates.forEach(ds => {
    const [y, m, d] = ds.split('-');
    const opt = document.createElement('option');
    opt.value = ds;
    opt.textContent = `${parseInt(m)}/${parseInt(d)}`;
    dateSelect.appendChild(opt);
  });

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

  populateTimeSelectors();
  generateSlots();

  const db = window.firebaseDB;
  const { firebaseRef, firebasePush, firebaseOnValue } = window;
  const availRef = firebaseRef(db, `rooms/${roomName}/availabilities`);
  const memoRef = firebaseRef(db, `rooms/${roomName}/memos`); // ★ 추가

  // 실시간 수신
  firebaseOnValue(availRef, snapshot => {
    // 기존 bar 제거
    document.querySelectorAll('.slot-group .availability-bar').forEach(el => el.remove());

    const data = snapshot.val() || {};
    Object.values(data).forEach(entry => {
      const { name, date, start, end, certainty } = entry;
      const startMin = toMinutes(start);
      const endMin = toMinutes(end);

      const slotGroups = document.querySelectorAll(`.day-column[data-date="${date}"] .slot-group`);
      slotGroups.forEach(group => {
        const groupStart = toMinutes(group.dataset.start);
        const groupEnd = groupStart + 30;

        const overlapStart = Math.max(groupStart, startMin);
        const overlapEnd = Math.min(groupEnd, endMin);
        if (overlapEnd > overlapStart) {
          const left = ((overlapStart - groupStart) / 30) * 100;
          const width = ((overlapEnd - overlapStart) / 30) * 100;

          const bar = document.createElement('div');
          bar.classList.add('availability-bar');
          bar.classList.add(certainty); // 'definite' or 'maybe'
          bar.style.left = `${left}%`;
          bar.style.width = `${width}%`;
          bar.title = `${start}~${end} ${name}`;

          group.appendChild(bar);
        }
      });
    });
  });

  // 입력 처리
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

  // 모임 정보 패널
  document.getElementById('meeting-name').textContent = meetingInfo.name || '';
  document.getElementById('meeting-location').textContent = meetingInfo.location ? `장소: ${meetingInfo.location}` : '';
  if (meetingInfo.link) {
    const a = document.getElementById('meeting-link');
    a.href = meetingInfo.link;
    a.textContent = meetingInfo.link;
  }
});

// 페이지 타이틀 설정
window.addEventListener('DOMContentLoaded', () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo'));
  const title = document.getElementById('meeting-title');
  if (info && info.name) title.textContent = info.name;
});
