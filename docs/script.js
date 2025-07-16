// 유틸 함수
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// 그룹별 강도(intensity) 업데이트 (definite vs maybe)
const updateIntensity = (groupDiv, countDefinite, countMaybe) => {
  // 1) 기존 intensity 클래스 제거
  groupDiv.classList.remove(
    "intensity-definite-1","intensity-definite-2","intensity-definite-3","intensity-definite-4",
    "intensity-maybe-1","intensity-maybe-2","intensity-maybe-3","intensity-maybe-4"
  );

  // 2) 더 많은 선택(확실 vs 가능) 쪽으로 우선 색상 결정
  const isDef = countDefinite >= countMaybe;
  const maxCount = Math.max(countDefinite, countMaybe);

  // 3) 사용자 수만큼 level 늘리되, CSS에 정의된 최대 4단계까지만
  const level = Math.min(maxCount, 4);

  // 4) level이 1 이상일 때만 클래스 추가
  if (level > 0) {
    const prefix = isDef ? "intensity-definite-" : "intensity-maybe-";
    groupDiv.classList.add(`${prefix}${level}`);
  }
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
        groupDiv.dataset.definite = 0;
        groupDiv.dataset.maybe = 0;

        const baseTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        groupDiv.dataset.start = baseTime;

        // 1분 단위 슬롯 생성
        for (let i = 0; i < groupInterval; i++) {
          const minutes = m + i;
          const hh = String(h + Math.floor(minutes / 60)).padStart(2, '0');
          const mm = String(minutes % 60).padStart(2, '0');
          const time = `${hh}:${mm}`;

          const minuteSlot = document.createElement('div');
          minuteSlot.classList.add('minute-slot');
          minuteSlot.dataset.time = time;
          minuteSlot.dataset.tooltip = '';  // 사용자 정보 표시용
          groupDiv.appendChild(minuteSlot);
        }

        // 시간 라벨 추가
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

  // 시간 정보가 있을 경우 ~ 또는 - 구분자로 분리
  if (info.time && (info.time.includes('~') || info.time.includes('-'))) {
    const [start, end] = info.time.split(/[-~]/).map(s => parseInt(s.trim(), 10));
    if (!isNaN(start)) startHour = start;
    if (!isNaN(end))   endHour = end;
  }

  // 시 옵션: startHour ~ endHour
  const hourOptions = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const hour = (startHour + i).toString().padStart(2, '0');
    return `<option value="${hour}">${hour}</option>`;
  }).join('');

  // 분 옵션: 00 ~ 59
  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    `<option value="${i.toString().padStart(2,'0')}">${i.toString().padStart(2,'0')}</option>`
  ).join('');

  // 각 셀렉터에 삽입
  document.getElementById('startHour').innerHTML    = hourOptions;
  document.getElementById('endHour').innerHTML      = hourOptions;
  document.getElementById('startMinute').innerHTML  = minuteOptions;
  document.getElementById('endMinute').innerHTML    = minuteOptions;
};


// 페이지 초기화
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
  const memoRef  = firebaseRef(db, `rooms/${roomName}/memos`); // 추후 메모 연동

  firebaseOnValue(availRef, snapshot => {
    // 1. 초기화
    document.querySelectorAll('.minute-slot').forEach(slot => {
      slot.classList.remove('busy-definite', 'busy-maybe');
      slot.dataset.tooltip = '';
    });

    document.querySelectorAll('.slot-group').forEach(group => {
      group.classList.remove(
        "intensity-definite-1","intensity-definite-2","intensity-definite-3","intensity-definite-4",
        "intensity-maybe-1","intensity-maybe-2","intensity-maybe-3","intensity-maybe-4"
      );
      group.dataset.definite = 0;
      group.dataset.maybe = 0;

      // 기존 바 제거
      group.querySelectorAll('.availability-bar').forEach(el => el.remove());
    });

    const data = snapshot.val() || {};

    Object.values(data).forEach(entry => {
      const { name, date, start, end, certainty } = entry;
      const sMin = toMinutes(start), eMin = toMinutes(end);

      const groups = document.querySelectorAll(
        `.day-column[data-date="${date}"] .slot-group`
      );

      groups.forEach(group => {
        const gStart = toMinutes(group.dataset.start);
        const gEnd = gStart + 30;

        // 1분 단위 슬롯 중 해당하는 시간대 체크
        const covers = Array.from(group.querySelectorAll('.minute-slot')).some(slot => {
          const t = toMinutes(slot.dataset.time);
          return t >= sMin && t < eMin;
        });
        if (!covers) return;

        // 각 slot에 busy 표시 및 툴팁 추가
        group.querySelectorAll('.minute-slot').forEach(slot => {
          const t = toMinutes(slot.dataset.time);
          if (t >= sMin && t < eMin) {
            slot.classList.add(
              certainty === 'definite' ? 'busy-definite' : 'busy-maybe'
            );
            slot.dataset.tooltip = slot.dataset.tooltip
              ? `${slot.dataset.tooltip}, ${name}`
              : name;
          }
        });

        // 카운트 누적
        if (certainty === 'definite') {
          group.dataset.definite = parseInt(group.dataset.definite, 10) + 1;
        } else {
          group.dataset.maybe = parseInt(group.dataset.maybe, 10) + 1;
        }

        // 겹치는 범위만큼 bar 시각화 (left/width 비율)
        const overlapStart = Math.max(gStart, sMin);
        const overlapEnd = Math.min(gEnd, eMin);
        if (overlapEnd > overlapStart) {
          const left = ((overlapStart - gStart) / 30) * 100;
          const width = ((overlapEnd - overlapStart) / 30) * 100;

          const bar = document.createElement('div');
          bar.classList.add('availability-bar');

          //bar.classList.add(certainty); // 'definite' or 'maybe'

          // ✅ 겹치는 인원 수 기반 단계 계산
          const count = parseInt(group.dataset[certainty], 10);
          const level = Math.min(count, 4); // 최대 4단계까지만

          // ✅ 클래스: definite-1, maybe-2 등 추가
          bar.classList.add(`${certainty}-${level}`);  

          bar.style.left = `${left}%`;
          bar.style.width = `${width}%`;
          bar.title = `${start}~${end} ${name}`;

          group.appendChild(bar);
        }
      });
    });

    // 마지막에 intensity 색상 단계 적용
    document.querySelectorAll('.slot-group').forEach(group => {
      updateIntensity(
        group,
        parseInt(group.dataset.definite, 10),
        parseInt(group.dataset.maybe, 10)
      );
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