// document.addEventListener('DOMContentLoaded', () => {
//   const stored = JSON.parse(localStorage.getItem('selectedDates')) || [];
//   const dateSelect = document.getElementById('date');
//   if (!dateSelect || stored.length === 0) return;

//   // 기존 <select> 옵션 초기화
//   dateSelect.innerHTML = '';

//   // 저장된 날짜만큼 <option> 생성
//   stored.forEach(ds => {
//     const [year, month, day] = ds.split('-');
//     const opt = document.createElement('option');
//     opt.value = ds;
//     opt.textContent = `${parseInt(month)}/${parseInt(day)}`;
//     dateSelect.appendChild(opt);
//   });
// });


// // 1) 타임슬롯 생성 로직 (기존 코드)
// const generateSlots = () => {
//   const startHour = 9, endHour = 22;
//   document.querySelectorAll(".time-slots").forEach(container => {
//     for (let h = startHour; h < endHour; h++) {
//       container.appendChild(createSlot(`${String(h).padStart(2,'0')}:00`));
//       container.appendChild(createSlot(`${String(h).padStart(2,'0')}:30`));
//     }
//   });
// };

// const createSlot = (time) => {
//   const div = document.createElement("div");
//   div.classList.add("slot");
//   div.dataset.time = time;
//   div.dataset.tooltip = "";
//   div.dataset.count = 0;
//   div.innerHTML = `<span>${time}</span>`;
//   return div;
// };

// const updateIntensity = (slot) => {
//   const count = parseInt(slot.dataset.count);
//   slot.classList.remove("intensity-2","intensity-3","intensity-4","intensity-5");
//   if      (count>=5) slot.classList.add("intensity-5");
//   else if (count===4) slot.classList.add("intensity-4");
//   else if (count===3) slot.classList.add("intensity-3");
//   else if (count===2) slot.classList.add("intensity-2");
// };

// // 2) 사용자가 직접 시간 등록할 때의 기존 로직
// document.getElementById("availabilityForm").addEventListener("submit", (e) => {
//   e.preventDefault();
//   const name = document.getElementById("name").value.trim();
//   const timeRange = document.getElementById("time").value.trim();
//   const date = document.getElementById("date").value;
//   const certainty = document.getElementById("certainty").value;
//   const [start,end] = timeRange.split("~").map(t => t.trim());
//   const slots = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;
//   let marking = false;
//   for (let slot of slots) {
//     if (slot.dataset.time === start) marking = true;
//     if (marking) {
//       const cls = certainty==="definite" ? "busy-definite" : "busy-maybe";
//       slot.classList.add(cls);
//       slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;
//       slot.dataset.count = parseInt(slot.dataset.count)+1;
//       updateIntensity(slot);
//     }
//     if (slot.dataset.time === end) break;
//   }
//   e.target.reset();
// });

// // 3) 슬롯 생성
// generateSlots();

// // 4) secondpage에서 넘어온 meetingInfo를 표시
// document.addEventListener('DOMContentLoaded', () => {
//   const info = JSON.parse(localStorage.getItem('meetingInfo'));
//   if (!info) return;

//   // 모임 이름
//   document.getElementById('meeting-name').textContent = info.name || '';

//   // 장소
//   document.getElementById('meeting-location').textContent =
//     info.location ? `장소: ${info.location}` : '';

//   // 링크
//   if (info.link) {
//     const a = document.getElementById('meeting-link');
//     a.textContent = info.link;
//     a.href = info.link;
//   }

//   // 더 이상 필요 없으면 주석 해제
//   // localStorage.removeItem('meetingInfo');
// });




// 1) 슬롯 생성 유틸
const generateSlots = () => {
  const startHour = 9, endHour = 22;
  document.querySelectorAll(".time-slots").forEach(container => {
    for (let h = startHour; h < endHour; h++) {
      container.appendChild(createSlot(`${String(h).padStart(2,'0')}:00`));
      container.appendChild(createSlot(`${String(h).padStart(2,'0')}:30`));
    }
  });
};
const createSlot = time => {
  const div = document.createElement("div");
  div.classList.add("slot");
  div.dataset.time = time;
  div.dataset.tooltip = "";
  div.dataset.count = 0;
  div.innerHTML = `<span>${time}</span>`;
  return div;
};
const updateIntensity = slot => {
  const c = parseInt(slot.dataset.count);
  slot.classList.remove("intensity-2","intensity-3","intensity-4","intensity-5");
  if      (c>=5) slot.classList.add("intensity-5");
  else if (c===4) slot.classList.add("intensity-4");
  else if (c===3) slot.classList.add("intensity-3");
  else if (c===2) slot.classList.add("intensity-2");
};

document.addEventListener('DOMContentLoaded', () => {
  // — 1) firstpage에서 선택된 날짜 가져오기 —
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];

  // — 2) 날짜 <select> 채우기 —
  const dateSelect = document.getElementById('date');
  dateSelect.innerHTML = '';
  selectedDates.forEach(ds => {
    const [y,m,d] = ds.split('-');
    const opt = document.createElement('option');
    opt.value = ds;
    opt.textContent = `${parseInt(m)}/${parseInt(d)}`;
    dateSelect.appendChild(opt);
  });

  // — 3) .schedule 내부에 day-column 동적 생성 —
  const scheduleEl = document.querySelector('.schedule');
  scheduleEl.innerHTML = '';
  selectedDates.forEach(ds => {
    const col = document.createElement('div');
    col.classList.add('day-column');
    col.dataset.date = ds;

    const [y,m,d] = ds.split('-');
    const label = document.createElement('div');
    label.classList.add('day-label');
    label.textContent = `${parseInt(m)}/${parseInt(d)}`;
    col.appendChild(label);

    const slotsDiv = document.createElement('div');
    slotsDiv.classList.add('time-slots');
    col.appendChild(slotsDiv);

    scheduleEl.appendChild(col);
  });

  // — 4) 타임슬롯 채우기 —
  generateSlots();

  // — 5) 사용자가 직접 시간 등록 로직 유지 —
  document.getElementById("availabilityForm")
    .addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const [startRaw,endRaw] = document.getElementById("time").value.trim().split("~").map(t => t.trim());
      const date = document.getElementById("date").value;
      const certainty = document.getElementById("certainty").value;
      const fmt = t => t.includes(':') ? t.padStart(5,'0') : t.padStart(2,'0') + ':00';
      const start = fmt(startRaw), end = fmt(endRaw);

      const slots = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;
      let mark = false;
      for (let slot of slots) {
        if (slot.dataset.time === start) mark = true;
        if (mark) {
          const cls = (certainty==="definite")?"busy-definite":"busy-maybe";
          slot.classList.add(cls);
          slot.dataset.tooltip = slot.dataset.tooltip
            ? `${slot.dataset.tooltip}, ${name}`
            : name;
          slot.dataset.count = parseInt(slot.dataset.count)+1;
          updateIntensity(slot);
        }
        if (slot.dataset.time === end) break;
      }
      e.target.reset();
    });

  // — 6) secondpage의 모임 정보 표시 유지 —
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  document.getElementById('meeting-name').textContent     = info.name || '';
  document.getElementById('meeting-location').textContent = info.location ? `장소: ${info.location}` : '';
  if (info.link) {
    const a = document.getElementById('meeting-link');
    a.href = info.link;
    a.textContent = info.link;
  }
});
