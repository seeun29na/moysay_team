/* -----------------------------------------
 * 1) Firebase 모듈 로드 & 초기화
 * ----------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/** [Firebase 설정] */
const firebaseConfig = {
  apiKey: "AIzaSyCiVW_fvG5hXmt_6aMeDRwXVU19ByRO1iA",
  authDomain: "moysay-d2606.firebaseapp.com",
  databaseURL: "https://moysay-d2606-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "moysay-d2606",
  storageBucket: "moysay-d2606.appspot.com",
  messagingSenderId: "843998694219",
  appId: "1:843998694219:web:219ec5ebdbf835c08076ce"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/** [공유] Firebase 유틸을 window에 노출(다른 코드와 호환) */
window.firebaseDB = db;
window.firebaseRef = ref;
window.firebasePush = push;
window.firebaseOnValue = onValue;

/* -----------------------------------------
 * 2) 페이지 상단/우하단 패널에 meetingInfo 반영
 * ----------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  let info = {};
  try { info = JSON.parse(localStorage.getItem('meetingInfo')) || {}; }
  catch { info = {}; }

  const name = info.name || '';
  const location = info.location || '';
  const link = info.link || '';

  // [상단 제목]
  const titleEl = document.getElementById('meeting-title');
  if (titleEl) titleEl.textContent = name ? `${name}` : '약속';

  // [우하단 패널]
  const nameEl = document.getElementById('meeting-name');
  const locEl  = document.getElementById('meeting-location');
  const linkEl = document.getElementById('meeting-link');

  if (nameEl) nameEl.textContent = name || '이름 미정';
  if (locEl)  locEl.textContent  = location ? `장소: ${location}` : '장소 미정';
  if (linkEl) {
    if (link) {
      const normalized = /^https?:\/\//i.test(link) ? link : `https://${link}`;
      linkEl.href = normalized;
      linkEl.style.display = '';
    } else {
      linkEl.removeAttribute('href');
      linkEl.style.display = 'none';
    }
  }
});

/* -----------------------------------------
 * 3) 유틸 함수
 * ----------------------------------------- */
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};
const pad2 = (n) => String(n).padStart(2, "0");
const minToHHMM = (mins) => `${pad2(Math.floor(mins/60))}:${pad2(mins%60)}`;

/** [강도 클래스 갱신] 선택/겹침 수에 따라 1~4단계 클래스 부여 */
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

/* -----------------------------------------
 * 4) 시간 슬롯(세로 보드) 생성
 * ----------------------------------------- */
const generateSlots = () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 9, endHour = 22;
  if (info.time && (info.time.includes('~') || info.time.includes('-'))) {
    const [start, end] = info.time.split(/[-~]/).map(s => parseInt(s.trim(), 10));
    if (!isNaN(start)) startHour = start;
    if (!isNaN(end))   endHour = end;
  }

  const groupInterval = 30; // [UI] 한 줄 = 30분
  document.querySelectorAll('.time-slots').forEach(container => {
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += groupInterval) {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('slot-group');
        groupDiv.dataset.definite = 0;
        groupDiv.dataset.maybe = 0;

        const baseTime = `${pad2(h)}:${pad2(m)}`;
        groupDiv.dataset.start = baseTime;

        // [시각화] 1분 단위 slot(내부 채움용)
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

        // [UI] 좌측 시간 라벨
        const label = document.createElement('span');
        label.classList.add('time-label');
        label.textContent = baseTime;
        groupDiv.appendChild(label);

        container.appendChild(groupDiv);
      }
    }
  });
};

/* -----------------------------------------
 * 5) 드롭박스 시간 선택(휠 지원)
 * ----------------------------------------- */
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

/** [UX] 마우스 휠로 select 올렸다 내리기 */
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

/* -----------------------------------------
 * 6) 드래그 선택(세로 보드) — 임시 선택 관리
 * ----------------------------------------- */
/** 날짜별 임시선택 저장소: Map<date, Map<'HH:MM','definite'|'maybe'>> */
const tempSelection = new Map();
const getDateMap = (date) => {
  if (!tempSelection.has(date)) tempSelection.set(date, new Map());
  return tempSelection.get(date);
};
const inlineCertainty = () =>
  (document.querySelector('input[name="inlineCertainty"]:checked')?.value) || 'definite';
const isDragMode = () => {
  const el = document.getElementById('dragContent');
  return el && !el.classList.contains('hidden');
};

/** [UI] 임시색 칠/해제 */
const paintGroupTemp = (groupEl, status, on, name='') => {
  groupEl.classList.toggle('temp-definite', on && status === 'definite');
  groupEl.classList.toggle('temp-maybe',    on && status === 'maybe');
  if (on) { groupEl.dataset.tempName = name; groupEl.title = name ? `[임시] ${name}` : '[임시 선택]'; }
  else { delete groupEl.dataset.tempName; groupEl.title = ''; }
};

/** [UI] 특정 날짜 컬럼 전체 다시 칠하기(실시간 반영 후 유지) */
const repaintDateTemp = (date) => {
  const dateMap = tempSelection.get(date) || new Map();
  document.querySelectorAll(`.day-column[data-date="${date}"] .slot-group`).forEach(g => {
    const key = g.dataset.start;
    const st = dateMap.get(key);
    g.classList.remove('temp-definite','temp-maybe');
    if (st) paintGroupTemp(g, st, true, g.dataset.tempName || '');
  });
};

/** 드래그 상태 */
const dragState = { dragging:false, date:null, mode:'add', status:'definite', anchorIdx:null, name:'' };
const groupsOfColumn = (colEl) => Array.from(colEl.querySelectorAll('.slot-group'));
const indexOfGroup  = (groups, groupEl) => groups.indexOf(groupEl);

/** [핵심] 범위 적용(추가/삭제) */
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

/** [바인딩] 보드 드래그 동작 */
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

    const date   = colEl.dataset.date;                // ⬅ 드래그한 컬럼의 날짜 자동 사용
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
    if (colEl.dataset.date !== dragState.date) return; // 다른 날짜면 무시

    const groups = groupsOfColumn(colEl);
    const idx    = indexOfGroup(groups, groupEl);
    applyRange(dragState.date, groups, dragState.anchorIdx, idx, dragState.mode, dragState.status, dragState.name);
  });

  document.addEventListener('mouseup', () => { dragState.dragging = false; });
};

/** [저장] 임시선택 → 30분 연속 구간으로 묶어 DB push */
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
    map.clear();
    repaintDateTemp(date);
  }

  tempSelection.clear();
  alert(`저장됨: 총 ${totalRanges}개 구간 — [${name}]`);
};

/** [초기화] 임시선택 전체 삭제 + 화면 반영 */
const clearTempSelection = () => {
  for (const [date] of tempSelection.entries()) { repaintDateTemp(date); }
  tempSelection.clear();
  document.querySelectorAll('.slot-group').forEach(g=>{
    g.classList.remove('temp-definite','temp-maybe');
  });
};

/* -----------------------------------------
 * 7) 초기 렌더 및 Firebase 구독/쓰기
 * ----------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const meetingInfo = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  const roomName = meetingInfo.name || 'default-room';

  /* [UI] 드롭다운 날짜 옵션 렌더 */
  const dateSelect = document.getElementById('date');
  dateSelect.innerHTML = '';
  selectedDates.forEach(ds => {
    const [, m, d] = ds.split('-');
    const opt = document.createElement('option');
    opt.value = ds;
    opt.textContent = `${parseInt(m)}/${parseInt(d)}`;
    dateSelect.appendChild(opt);
  });

  /* [UI] 날짜 컬럼 생성 (각 컬럼 자체도 .panel 톤으로 통일) */
  const scheduleEl = document.querySelector('.schedule');
  scheduleEl.innerHTML = '';
  selectedDates.forEach(ds => {
    const col = document.createElement('div');
    col.classList.add('panel','day-column'); // ← 통일된 카드 스타일
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

  /* [UI] 드롭박스 시간 셀렉트 & 슬롯 생성 */
  populateTimeSelectors();
  generateSlots();
  bindOverlapHover();

  /* ===== Firebase 경로 ===== */
  const availRef = ref(db, `rooms/${roomName}/availabilities`);
  const metaRef  = ref(db, `rooms/${roomName}/meta`);

  /* [메타] 마감 저장(한 번) */
  (function saveDeadlineOnce() {
    const mi = JSON.parse(localStorage.getItem('meetingInfo')) || {};
    if (!mi.deadline) return;
    const deadlinePathRef = ref(db, `rooms/${roomName}/meta/deadline`);
    onValue(deadlinePathRef, (snap) => {
      const cur = snap.val();
      if (cur == null) {
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js")
          .then(({ update }) => { update(metaRef, { deadline: mi.deadline }); })
          .catch(console.error);
      }
    }, { onlyOnce: true });
  })();

  /* [메타] 마감 감시 → 결과 페이지로 자동 이동 */
  (function watchDeadlineAndRedirect() {
    const deadlineRef = ref(db, `rooms/${roomName}/meta/deadline`);
    onValue(deadlineRef, (snap) => {
      const dl = snap.val();
      if (!dl) return;
      if (Date.now() >= dl) {
        window.location.href = `./result.html?room=${encodeURIComponent(roomName)}`;
      }
    });
  })();

  /* [실시간 시각화] 다른 사용자 입력 실시간 반영 */
  onValue(availRef, snapshot => {
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

        // 이 30분 구간을 덮는지 검사
        const covers = Array.from(group.querySelectorAll('.minute-slot')).some(slot => {
          const t = toMinutes(slot.dataset.time);
          return t >= sMin && t < eMin;
        });
        if (!covers) return;

        // 내부 minute-slot 색 채우기
        group.querySelectorAll('.minute-slot').forEach(slot => {
          const t = toMinutes(slot.dataset.time);
          if (t >= sMin && t < eMin) {
            slot.classList.add(certainty === 'definite' ? 'busy-definite' : 'busy-maybe');
            slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;
          }
        });

        // 집계
        if (certainty === 'definite') group.dataset.definite = parseInt(group.dataset.definite, 10) + 1;
        else                          group.dataset.maybe    = parseInt(group.dataset.maybe, 10) + 1;

        // 가시화를 위한 부분 bar 생성
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

          // [겹치는 사람 패널에 쓰기 위한 메타]
          bar.dataset.name = name;
          bar.dataset.certainty = certainty;

          group.appendChild(bar);

          // [유지] 임시 선택 다시 칠하기 + hover 바인딩
          for (const [date] of tempSelection.entries()) repaintDateTemp(date);
          bindOverlapHover();
        }
      });
    });

    // [마지막] 강도 단계 클래스 적용
    document.querySelectorAll('.slot-group').forEach(group => {
      updateIntensity(
        group,
        parseInt(group.dataset.definite, 10),
        parseInt(group.dataset.maybe, 10)
      );
    });

    // [유지] 임시 선택 보정
    for (const [date] of tempSelection.entries()) repaintDateTemp(date);
  });

  /* [폼] 드롭박스 입력 저장 */
  document.getElementById('availabilityForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = (document.getElementById('name').value || '').trim();
    if (!name) { alert('이름을 먼저 입력하세요.'); return; }

    const date = document.getElementById('date').value;
    const certainty = inlineCertainty();
    const start = `${document.getElementById('startHour').value}:${document.getElementById('startMinute').value}`;
    const end   = `${document.getElementById('endHour').value}:${document.getElementById('endMinute').value}`;

    window.firebasePush(availRef, { name, date, start, end, certainty });
    e.target.reset();
  });

  /* [네비] 결과 화면 이동 */
  document.getElementById('goResultBtn')?.addEventListener('click', () => {
    window.location.href = `./result.html?room=${encodeURIComponent(roomName)}`;
  });

  /* [모드 전환] 드롭박스 ↔ 드래그 */
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

  /* [드래그 저장/초기화] */
  bindScheduleDrag();
  document.getElementById('dragClear')?.addEventListener('click', clearTempSelection);
  document.getElementById('dragSave')?.addEventListener('click', () => saveTempSelection(availRef));

  /* [UX] select에 휠 바인딩 */
  ['startHour','startMinute','endHour','endMinute']
    .forEach(id => bindWheelToSelect(document.getElementById(id)));

  /* [보조] 라디오 변경 → (예전 코드 호환용) select 확실성 동기화 */
  document.querySelectorAll('input[name="inlineCertainty"]').forEach(r => {
    r.addEventListener('change', () => {
      const sel = document.getElementById('certainty');
      if (sel) sel.value = inlineCertainty();
    });
  });
});

/* -----------------------------------------
 * 8) 겹치는 사람 패널
 * ----------------------------------------- */
let panelEl, panelTime, listSure, listMaybe;
function initOverlapPanel(){
  panelEl   = document.getElementById('overlap-panel');
  panelTime = panelEl?.querySelector('.op-time') || null;
  listSure  = document.getElementById('op-list-sure') || null;
  listMaybe = document.getElementById('op-list-maybe') || null;
}

/** 특정 슬록 그룹에 마우스 올렸을 때 패널 갱신 */
function showOverlapForGroup(groupEl){
  if (!panelEl) { initOverlapPanel(); }
  if (!panelEl) return;

  const date  = groupEl.closest('.day-column')?.dataset.date || '';
  const start = groupEl.dataset.start || '';

  const sure  = new Set();
  const maybe = new Set();

  // [1] availability-bar 기반 수집(정확)
  groupEl.querySelectorAll('.availability-bar').forEach(bar=>{
    const nm = (bar.dataset.name || '').trim();
    const ct = bar.dataset.certainty;
    if (!nm || !ct) return;
    (ct === 'definite' ? sure : maybe).add(nm);
  });

  // [2] 보조: minute-slot의 tooltip 파싱
  if (sure.size === 0 && maybe.size === 0) {
    groupEl.querySelectorAll('.minute-slot').forEach(ms=>{
      const names = (ms.dataset.tooltip || '').split(',').map(s=>s.trim()).filter(Boolean);
      if (!names.length) return;
      const isDef = ms.classList.contains('busy-definite');
      names.forEach(n => (isDef ? sure : maybe).add(n));
    });
  }

  if (panelTime) panelTime.textContent = `${date} ${start} 기준 (확실 ${sure.size} · 가능 ${maybe.size})`;
  if (listSure)  listSure.innerHTML    = sure.size  ? [...sure].sort().map(n=>`<li>${n}</li>`).join('')  : '<li>없음</li>';
  if (listMaybe) listMaybe.innerHTML   = maybe.size ? [...maybe].sort().map(n=>`<li>${n}</li>`).join('') : '<li>없음</li>';
}

/** 새로 생성되는 슬롯그룹에도 hover 바인딩 */
function bindOverlapHover(){
  const groups = document.querySelectorAll('.day-column .slot-group');
  groups.forEach(g=>{
    if (!g.dataset._opBound) {
      g.addEventListener('mouseenter', ()=> showOverlapForGroup(g));
      g.addEventListener('click',      ()=> showOverlapForGroup(g));
      g.dataset._opBound = '1';
    }
  });
}
document.addEventListener('DOMContentLoaded', initOverlapPanel);