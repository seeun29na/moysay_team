// // 1) 타임슬롯 생성 로직 (기존 코드)
// const generateSlots = () => {
// <<<<<<< Updated upstream
//   const startHour = 9, endHour = 22;
//   document.querySelectorAll(".time-slots").forEach(container => {
//     for (let h = startHour; h < endHour; h++) {
//       container.appendChild(createSlot(`${String(h).padStart(2,'0')}:00`));
//       container.appendChild(createSlot(`${String(h).padStart(2,'0')}:30`));
// =======
//   const startHour = 9;
//   const endHour = 22;
//   const groupInterval = 30; // 30분 단위 그룹

//   document.querySelectorAll(".time-slots").forEach(container => {
//     for (let h = startHour; h < endHour; h++) {
//       for (let m = 0; m < 60; m += groupInterval) {
//         const groupDiv = document.createElement("div");
//         groupDiv.classList.add("slot-group");
//         groupDiv.dataset.count = 0;

//         const baseTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
//         groupDiv.dataset.start = baseTime;

//         for (let i = 0; i < groupInterval; i++) {
//           const minutes = m + i;
//           const hh = String(h + Math.floor(minutes / 60)).padStart(2, '0');
//           const mm = String(minutes % 60).padStart(2, '0');
//           const time = `${hh}:${mm}`;
//           const minuteSlot = document.createElement("div");
//           minuteSlot.classList.add("minute-slot");
//           minuteSlot.dataset.time = time;
//           groupDiv.appendChild(minuteSlot);
//         }

//         const label = document.createElement("span");
//         label.classList.add("time-label");
//         label.textContent = baseTime;
//         groupDiv.appendChild(label);

//         container.appendChild(groupDiv);
//       }
// >>>>>>> Stashed changes
//     }
//   });
// };

// const updateIntensity = (groupDiv, count) => {
//   groupDiv.classList.remove("intensity-2", "intensity-3", "intensity-4", "intensity-5");
//   if (count >= 29) groupDiv.classList.add("intensity-5");
//   else if (count >= 20) groupDiv.classList.add("intensity-4");
//   else if (count >= 10) groupDiv.classList.add("intensity-3");
//   else if (count >= 5) groupDiv.classList.add("intensity-2");
// };

// <<<<<<< Updated upstream
// const updateIntensity = (slot) => {
//   const count = parseInt(slot.dataset.count);
//   slot.classList.remove("intensity-2","intensity-3","intensity-4","intensity-5");
//   if      (count>=5) slot.classList.add("intensity-5");
//   else if (count===4) slot.classList.add("intensity-4");
//   else if (count===3) slot.classList.add("intensity-3");
//   else if (count===2) slot.classList.add("intensity-2");
// =======
// const toMinutes = (timeStr) => {
//   const [h, m] = timeStr.split(":").map(Number);
//   return h * 60 + m;
// };

// const populateTimeSelectors = () => {
//   const hourOptions = Array.from({ length: 24 }, (_, i) =>
//     `<option value="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</option>`
//   ).join('');

//   const minuteOptions = Array.from({ length: 60 }, (_, i) =>
//     `<option value="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</option>`
//   ).join('');

//   document.getElementById("startHour").innerHTML = hourOptions;
//   document.getElementById("endHour").innerHTML = hourOptions;
//   document.getElementById("startMinute").innerHTML = minuteOptions;
//   document.getElementById("endMinute").innerHTML = minuteOptions;
// >>>>>>> Stashed changes
// };

// // 2) 사용자가 직접 시간 등록할 때의 기존 로직
// document.getElementById("availabilityForm").addEventListener("submit", (e) => {
//   e.preventDefault();

//   const name = document.getElementById("name").value.trim();
//   const date = document.getElementById("date").value;
//   const certainty = document.getElementById("certainty").value;
// <<<<<<< Updated upstream
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
// =======

//   const start = `${document.getElementById("startHour").value}:${document.getElementById("startMinute").value}`;
//   const end = `${document.getElementById("endHour").value}:${document.getElementById("endMinute").value}`;

//   const startTime = toMinutes(start);
//   const endTime = toMinutes(end);

//   const slotGroups = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;

//   for (let group of slotGroups) {
//     const minuteSlots = group.querySelectorAll(".minute-slot");

//     for (let slot of minuteSlots) {
//       const slotMinutes = toMinutes(slot.dataset.time);
//       if (slotMinutes >= startTime && slotMinutes < endTime) {
//         slot.classList.add(certainty === "definite" ? "busy-definite" : "busy-maybe");

//         let count = parseInt(group.dataset.count);
//         count += 1;
//         group.dataset.count = count;

//         updateIntensity(group, count);
//       }
//     }
// >>>>>>> Stashed changes
//   }
//   e.target.reset();
// });

// <<<<<<< Updated upstream
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
// =======
// document.addEventListener("DOMContentLoaded", () => {
//   populateTimeSelectors();
//   generateSlots();
// });
// >>>>>>> Stashed changes

// 시간 슬롯 생성 함수
const generateSlots = () => {
  const startHour = 9;
  const endHour = 22;
  const groupInterval = 30; // 30분 단위 그룹

  document.querySelectorAll(".time-slots").forEach(container => {
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

// 강도(혼잡도) 색상 업데이트 함수
const updateIntensity = (groupDiv, count) => {
  groupDiv.classList.remove("intensity-2", "intensity-3", "intensity-4", "intensity-5");
  if (count >= 29) groupDiv.classList.add("intensity-5");
  else if (count >= 20) groupDiv.classList.add("intensity-4");
  else if (count >= 10) groupDiv.classList.add("intensity-3");
  else if (count >= 5) groupDiv.classList.add("intensity-2");
};

// 시간 문자열을 분으로 변환
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// 시간 선택 드롭다운 생성
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

// 사용자가 시간 범위 제출 시 동작
document.getElementById("availabilityForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const date = document.getElementById("date").value;
  const certainty = document.getElementById("certainty").value;

  const start = `${document.getElementById("startHour").value}:${document.getElementById("startMinute").value}`;
  const end = `${document.getElementById("endHour").value}:${document.getElementById("endMinute").value}`;

  const startTime = toMinutes(start);
  const endTime = toMinutes(end);

  const slotGroups = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;

  for (let group of slotGroups) {
    const minuteSlots = group.querySelectorAll(".minute-slot");

    for (let slot of minuteSlots) {
      const slotMinutes = toMinutes(slot.dataset.time);
      if (slotMinutes >= startTime && slotMinutes < endTime) {
        slot.classList.add(certainty === "definite" ? "busy-definite" : "busy-maybe");

        slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;

        // 개별 슬롯의 count 증가
        let count = parseInt(slot.dataset.count || "0");
        count += 1;
        slot.dataset.count = count;

        // 그룹 전체 count 증가
        let groupCount = parseInt(group.dataset.count || "0") + 1;
        group.dataset.count = groupCount;
        updateIntensity(group, groupCount);
      }
    }
  }

  e.target.reset();
});

// 페이지 로드 시 시간 선택 셀렉터 + 슬롯 생성
document.addEventListener("DOMContentLoaded", () => {
  populateTimeSelectors();
  generateSlots();

  // secondpage에서 meetingInfo 불러오기
  const info = JSON.parse(localStorage.getItem('meetingInfo'));
  if (!info) return;

  document.getElementById('meeting-name').textContent = info.name || '';
  document.getElementById('meeting-location').textContent = info.location ? `장소: ${info.location}` : '';

  if (info.link) {
    const a = document.getElementById('meeting-link');
    a.textContent = info.link;
    a.href = info.link;
  }

  // localStorage.removeItem('meetingInfo'); // 필요시 해제
});
