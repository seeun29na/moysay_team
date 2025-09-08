// ===================== 유틸 =====================
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};
const pad2 = (n) => String(n).padStart(2, "0");
const minToHHMM = (mins) => `${pad2(Math.floor(mins/60))}:${pad2(mins%60)}`;

// 결과 보드(세로) 강도 업데이트
const updateIntensity = (groupDiv, countDefinite, countMaybe) => {
  groupDiv.classList.remove(
    "intensity-definite-1","intensity-definite-2","intensity-definite-3","intensity-definite-4",
    "intensity-maybe-1","intensity-maybe-2","intensity-maybe-3","intensity-maybe-4"
  );
  const isDef = countDefinite >= countMaybe;
  const maxCount = Math.max(countDefinite, countMaybe);
  const level = Math.min(maxCount, 4);
  if (level > 0) {
    groupDiv.classList.add(`${isDef ? "intensity-definite-" : "intensity-maybe-"}${level}`);
  }
};

// ===================== 결과 보드(세로) 슬롯 생성 =====================
const generateSlots = () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 9, endHour = 22;
  if (info.time && (info.time.includes('~') || info.time.includes('-'))) {
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

        const baseTime = `${pad2(h)}:${pad2(m)}`;
        groupDiv.dataset.start = baseTime;

        // 1분 단위 minute-slot (시각화용)
        for (let i = 0; i < groupInterval; i++) {
          const minutes = m + i;
          const hh = pad2(h + Math.floor(minutes / 60));
          const mm = pad2(minutes % 60);
          const minuteSlot = document.createElement('div');
          minuteSlot.classList.add('minute-slot');
          minuteSlot.dataset.time = `${hh}:${mm}`;
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

// ===================== 드롭박스 시간 선택(휠 지원) =====================
const populateTimeSelectors = () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 0, endHour = 23;
  if (info.time && (info.time.includes('~') || info.time.includes('-'))) {
    const [start, end] = info.time.split(/[-~]/).map(s => parseInt(s.trim(), 10));
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
  document.getElementById('startHour').innerHTML    = hourOptions;
  document.getElementById('endHour').innerHTML      = hourOptions;
  document.getElementById('startMinute').innerHTML  = minuteOptions;
  document.getElementById('endMinute').innerHTML    = minuteOptions;
};

const bindWheelToSelect = (selectEl) => {
  if (!selectEl) return;
  selectEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    let idx = selectEl.selectedIndex + dir;
    idx = Math.max(0, Math.min(idx, selectEl.options.length - 1));
    selectEl.selectedIndex = idx;
  }, { passive: false });
};

// ===================== 시간표 드래그(세로) - 임시 선택 누적 =====================
const tempSelection = new Map(); // Map<date, Map<'HH:MM','definite'|'maybe'>>
const getDateMap = (date) => { if (!tempSelection.has(date)) tempSelection.set(date, new Map()); return tempSelection.get(date); };
const inlineCertainty = () => (document.querySelector('input[name="inlineCertainty"]:checked')?.value) || 'definite';
const isDragMode = () => { const el = document.getElementById('dragContent'); return el && !el.classList.contains('hidden'); };

const paintGroupTemp = (groupEl, status, on, name='') => {
  groupEl.classList.toggle('temp-definite', on && status === 'definite');
  groupEl.classList.toggle('temp-maybe',    on && status === 'maybe');
  if (on) { groupEl.dataset.tempName = name; groupEl.title = name ? `[임시] ${name}` : '[임시 선택]'; }
  else { delete groupEl.dataset.tempName; groupEl.title = ''; }
};

const repaintDateTemp = (date) => {
  const dateMap = tempSelection.get(date) || new Map();
  document.querySelectorAll(`.day-column[data-date="${date}"] .slot-group`).forEach(g => {
    const key = g.dataset.start;
    const st = dateMap.get(key);
    g.classList.remove('temp-definite','temp-maybe');
    if (st) paintGroupTemp(g, st, true, g.dataset.tempName || '');
  });
};

const dragState = { dragging:false, date:null, mode:'add', status:'definite', anchorIdx:null, name:'' };
const groupsOfColumn = (colEl) => Array.from(colEl.querySelectorAll('.slot-group'));
const indexOfGroup  = (groups, groupEl) => groups.indexOf(groupEl);

const applyRange = (date, groups, i1, i2, mode, status, name) => {
  const [s, e] = i1 <= i2 ? [i1, i2] : [i2, i1];
  const dateMap = getDateMap(date);
  for (let i = s; i <= e; i++) {
    const g   = groups[i];
    const key = g.dataset.start;
    if (mode === 'remove' && dateMap.has(key)) {
      dateMap.delete(key);
      paintGroupTemp(g, status, false);
      g.classList.remove('temp-definite','temp-maybe');
    } else if (mode === 'add') {
      dateMap.set(key, status);
      paintGroupTemp(g, status, true, name);
    }
  }
};

const bindScheduleDrag = () => {
  const schedule = document.querySelector('.schedule');
  if (!schedule) return;

  schedule.addEventListener('mousedown', (e) => {
    if (!isDragMode()) return;

    const name = (document.getElementById('name')?.value || '').trim();
    if (!name) { alert('이름을 먼저 입력하세요.'); return; }

    const groupEl = e.target.closest('.slot-group');
    const colEl   = e.target.closest('.day-column');
    if (!groupEl || !colEl) return;

    const date   = colEl.dataset.date;          // ⬅ 드래그한 컬럼의 날짜 자동 사용
    const groups = groupsOfColumn(colEl);
    const idx    = indexOfGroup(groups, groupEl);
    const key    = groupEl.dataset.start;

    dragState.dragging  = true;
    dragState.date      = date;
    dragState.status    = inlineCertainty();
    dragState.name      = name;
    dragState.mode      = getDateMap(date).has(key) ? 'remove' : 'add';
    dragState.anchorIdx = idx;

    applyRange(date, groups, idx, idx, dragState.mode, dragState.status, name);
  });

  schedule.addEventListener('mouseover', (e) => {
    if (!dragState.dragging || !isDragMode()) return;

    const groupEl = e.target.closest('.slot-group');
    const colEl   = e.target.closest('.day-column');
    if (!groupEl || !colEl) return;
    if (colEl.dataset.date !== dragState.date) return; // 다른 날짜로 넘어가면 무시

    const groups = groupsOfColumn(colEl);
    const idx    = indexOfGroup(groups, groupEl);
    applyRange(dragState.date, groups, dragState.anchorIdx, idx, dragState.mode, dragState.status, dragState.name);
  });

  document.addEventListener('mouseup', () => { dragState.dragging = false; });
};

// 임시 선택을 30분 연속으로 묶어 저장
// (교체) 모든 날짜의 임시 선택을 30분 연속 구간으로 묶어 한 번에 저장
const saveTempSelection = (availRef) => {
  const name = (document.getElementById('name')?.value || '').trim();
  if (!name) { alert('이름을 먼저 입력하세요.'); return; }
  if (tempSelection.size === 0) { alert('드래그로 선택한 칸이 없습니다.'); return; }

  let totalRanges = 0;

  for (const [date, map] of tempSelection.entries()) {
    if (!map || map.size === 0) continue;

    const entries = Array.from(map.entries())
      .map(([hhmm, st]) => ({ min: toMinutes(hhmm), status: st }))
      .sort((a,b)=> a.min - b.min);

    let curStart = entries[0].min;
    let curEnd   = entries[0].min + 30;
    let curSt    = entries[0].status;
    const ranges = [];

    for (let i=1;i<entries.length;i++){
      const {min, status} = entries[i];
      if (status === curSt && min === curEnd){
        curEnd += 30;
      } else {
        ranges.push({ start: curStart, end: curEnd, status: curSt });
        curStart = min; curEnd = min + 30; curSt = status;
      }
    }
    ranges.push({ start: curStart, end: curEnd, status: curSt });

    ranges.forEach(r => {
      window.firebasePush(availRef, {
        name, date,
        start: minToHHMM(r.start),
        end:   minToHHMM(r.end),
        certainty: r.status
      });
    });

    totalRanges += ranges.length;
    // 날짜별 임시 선택 지우고 화면에서 임시색 제거
    map.clear();
    repaintDateTemp(date);
  }

  tempSelection.clear();
  alert(`저장됨: 총 ${totalRanges}개 구간 — [${name}]`);
};

// (교체) 모든 날짜 임시 선택 전체 삭제
const clearTempSelection = () => {
  for (const [date] of tempSelection.entries()) {
    repaintDateTemp(date);
  }
  tempSelection.clear();
  // 화면의 임시색 일괄 제거
  document.querySelectorAll('.slot-group').forEach(g=>{
    g.classList.remove('temp-definite','temp-maybe');
  });
};

// ===================== 페이지 초기화 =====================
document.addEventListener('DOMContentLoaded', () => {
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const meetingInfo = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  const roomName = meetingInfo.name || 'default-room';

  // 날짜 셀렉트
  const dateSelect = document.getElementById('date');
  dateSelect.innerHTML = '';
  selectedDates.forEach(ds => {
    const [, m, d] = ds.split('-');
    const opt = document.createElement('option');
    opt.value = ds;
    opt.textContent = `${parseInt(m)}/${parseInt(d)}`;
    dateSelect.appendChild(opt);
  });

  // 결과 보드 컬럼
  const scheduleEl = document.querySelector('.schedule');
  scheduleEl.innerHTML = '';
  selectedDates.forEach(ds => {
    const col = document.createElement('div');
    col.classList.add('day-column');
    col.dataset.date = ds;

    const [, m, d] = ds.split('-');
    const label = document.createElement('div');
    label.classList.add('day-label');
    label.textContent = `${parseInt(m)}/${parseInt(d)}`;
    col.appendChild(label);

    const slotsDiv = document.createElement('div');
    slotsDiv.classList.add('time-slots');
    col.appendChild(slotsDiv);

    scheduleEl.appendChild(col);
  });

  // 드롭박스 시간 선택 & 보드 슬롯 생성
  populateTimeSelectors();
  generateSlots();

  // ===== Firebase =====
  const db = window.firebaseDB;
  const { firebaseRef, firebasePush, firebaseOnValue } = window;
  const availRef = firebaseRef(db, `rooms/${roomName}/availabilities`);

  // 마감 저장/감시
  const metaRef = firebaseRef(db, `rooms/${roomName}/meta`);
  (function saveDeadlineOnce() {
    const mi = JSON.parse(localStorage.getItem('meetingInfo')) || {};
    if (!mi.deadline) return;
    const deadlinePathRef = firebaseRef(db, `rooms/${roomName}/meta/deadline`);
    window.firebaseOnValue(deadlinePathRef, (snap) => {
      const cur = snap.val();
      if (cur == null) {
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js")
          .then(({ update }) => { update(metaRef, { deadline: mi.deadline }); })
          .catch(console.error);
      }
    }, { onlyOnce: true });
  })();
  (function watchDeadlineAndRedirect() {
    const deadlineRef = firebaseRef(db, `rooms/${roomName}/meta/deadline`);
    window.firebaseOnValue(deadlineRef, (snap) => {
      const dl = snap.val();
      if (!dl) return;
      if (Date.now() >= dl) {
        window.location.href = `./result.html?room=${encodeURIComponent(roomName)}`;
      }
    });
  })();

  // 실시간 시각화 (기존 유지)
  firebaseOnValue(availRef, snapshot => {
    // 초기화
    document.querySelectorAll('.minute-slot').forEach(slot => {
      slot.classList.remove('busy-definite', 'busy-maybe');
      slot.dataset.tooltip = '';
    });
    document.querySelectorAll('.slot-group').forEach(group => {
      group.classList.remove(
        "intensity-definite-1","intensity-definite-2","intensity-definite-3","intensity-definite-4",
        "intensity-maybe-1","intensity-maybe-2","intensity-maybe-3","intensity-maybe-4",
        "temp-definite","temp-maybe"
      );
      group.dataset.definite = 0;
      group.dataset.maybe = 0;
      group.querySelectorAll('.availability-bar').forEach(el => el.remove());
    });

    const data = snapshot.val() || {};
    Object.values(data).forEach(entry => {
      const { name, date, start, end, certainty } = entry;
      const sMin = toMinutes(start), eMin = toMinutes(end);
      const groups = document.querySelectorAll(`.day-column[data-date="${date}"] .slot-group`);

      groups.forEach(group => {
        const gStart = toMinutes(group.dataset.start);
        const gEnd = gStart + 30;

        const covers = Array.from(group.querySelectorAll('.minute-slot')).some(slot => {
          const t = toMinutes(slot.dataset.time);
          return t >= sMin && t < eMin;
        });
        if (!covers) return;

        group.querySelectorAll('.minute-slot').forEach(slot => {
          const t = toMinutes(slot.dataset.time);
          if (t >= sMin && t < eMin) {
            slot.classList.add(certainty === 'definite' ? 'busy-definite' : 'busy-maybe');
            slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;
          }
        });

        if (certainty === 'definite') group.dataset.definite = parseInt(group.dataset.definite, 10) + 1;
        else                          group.dataset.maybe    = parseInt(group.dataset.maybe, 10) + 1;

        const overlapStart = Math.max(gStart, sMin);
        const overlapEnd   = Math.min(gEnd, eMin);
        if (overlapEnd > overlapStart) {
          const left = ((overlapStart - gStart) / 30) * 100;
          const width = ((overlapEnd - overlapStart) / 30) * 100;

          const bar = document.createElement('div');
          bar.classList.add('availability-bar');

          const count = parseInt(group.dataset[certainty], 10);
          const level = Math.min(count, 4);
          bar.classList.add(`${certainty}-${level}`);

          bar.style.left = `${left}%`;
          bar.style.width = `${width}%`;
          bar.title = `${start}~${end} ${name}`;

          group.appendChild(bar);
        }
      });
    });

    // 강도 단계 최종적용
    document.querySelectorAll('.slot-group').forEach(group => {
      updateIntensity(
        group,
        parseInt(group.dataset.definite, 10),
        parseInt(group.dataset.maybe, 10)
      );
    });

    // 임시 선택 유지(실시간 반영 후 다시 칠하기)
    // (교체) 임시 선택 유지: 현재 임시선택 중인 모든 날짜 다시 칠하기
    for (const [date] of tempSelection.entries()) repaintDateTemp(date);
  });

  // 드롭박스 입력 처리 (확실성은 상단 라디오 사용)
  document.getElementById('availabilityForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = (document.getElementById('name').value || '').trim();
    if (!name) { alert('이름을 먼저 입력하세요.'); return; }

    const date = document.getElementById('date').value;
    const certainty = inlineCertainty(); // 라디오
    const start = `${document.getElementById('startHour').value}:${document.getElementById('startMinute').value}`;
    const end   = `${document.getElementById('endHour').value}:${document.getElementById('endMinute').value}`;

    window.firebasePush(availRef, { name, date, start, end, certainty });
    e.target.reset();
  });

  // 결과 화면 이동
  const goBtn = document.getElementById('goResultBtn');
  if (goBtn) goBtn.addEventListener('click', () => {
    window.location.href = `./result.html?room=${encodeURIComponent(roomName)}`;
  });

  // ===== 모드 전환 =====
  const segDrop = document.getElementById('segDrop');
  const segDrag = document.getElementById('segDrag');
  const dropdownContent = document.getElementById('dropdownContent');
  const dragContent = document.getElementById('dragContent');

  const setMode = (mode) => {
    const isDrop = mode === 'drop';
    dropdownContent.classList.toggle('hidden', !isDrop);
    dragContent.classList.toggle('hidden', isDrop);
    segDrop.classList.toggle('active', isDrop);
    segDrag.classList.toggle('active', !isDrop);
  };
  segDrop?.addEventListener('click', () => setMode('drop'));
  segDrag?.addEventListener('click', () => setMode('drag'));
  setMode('drop');

  // 시간표 드래그 바인딩 및 버튼
  bindScheduleDrag();
  document.getElementById('dragClear')?.addEventListener('click', clearTempSelection);
  document.getElementById('dragSave')?.addEventListener('click', () => saveTempSelection(availRef));

  // 드롭박스 select 휠 바인딩
  ['startHour','startMinute','endHour','endMinute'].forEach(id => bindWheelToSelect(document.getElementById(id)));

  // 라디오 변경 시 select 확실성 동기화
  document.querySelectorAll('input[name="inlineCertainty"]').forEach(r => {
    r.addEventListener('change', () => {
      const sel = document.getElementById('certainty');
      if (sel) sel.value = inlineCertainty();
    });
  });
});

// ===================== 페이지 타이틀 =====================
window.addEventListener('DOMContentLoaded', () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo'));
  const title = document.getElementById('meeting-title');
  if (info && info.name) title.textContent = info.name;
});
