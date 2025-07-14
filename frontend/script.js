const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// const updateIntensity = (groupDiv, count) => {
//   groupDiv.classList.remove("intensity-2", "intensity-3", "intensity-4", "intensity-5");
//   if (count >= 29) groupDiv.classList.add("intensity-5");
//   else if (count >= 20) groupDiv.classList.add("intensity-4");
//   else if (count >= 10) groupDiv.classList.add("intensity-3");
//   else if (count >= 5) groupDiv.classList.add("intensity-2");
// };

const updateIntensity = (groupDiv, countDefinite, countMaybe) => {
  // 기존 스타일 제거
  groupDiv.classList.remove(
    "intensity-definite-1", "intensity-definite-2", "intensity-definite-3", "intensity-definite-4",
    "intensity-maybe-1", "intensity-maybe-2", "intensity-maybe-3", "intensity-maybe-4"
  );

  // 가장 많은 종류 기준으로 강도 판단
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

const generateSlots = () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  let startHour = 9;
  let endHour = 22;

  // 사용자가 입력한 시간대가 있다면 적용
  if (info.time && info.time.includes('~')) {
    const [start, end] = info.time.split('~').map(s => parseInt(s.trim()));
    if (!isNaN(start)) startHour = start;
    if (!isNaN(end)) endHour = end;
  }

  const groupInterval = 30; // 30분 단위

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
  // 날짜 <select> 생성
  const selectedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const dateSelect = document.getElementById('date');
  if (dateSelect) {
    dateSelect.innerHTML = '';
    selectedDates.forEach(ds => {
      const [y, m, d] = ds.split('-');
      const opt = document.createElement('option');
      opt.value = ds;
      opt.textContent = `${parseInt(m)}/${parseInt(d)}`;
      dateSelect.appendChild(opt);
    });
  }

  // .schedule 칼럼 생성
  const scheduleEl = document.querySelector('.schedule');
  if (scheduleEl) {
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
  }

  // 시간 선택 dropdown 채우기
  populateTimeSelectors();

  // 타임 슬롯 생성
  generateSlots();

//   // 사용자가 입력한 시간 → 시각화 반영
//   document.getElementById("availabilityForm").addEventListener("submit", (e) => {
//     e.preventDefault();

//     const name = document.getElementById("name").value.trim();
//     const date = document.getElementById("date").value;
//     const certainty = document.getElementById("certainty").value;

//     const start = `${document.getElementById("startHour").value}:${document.getElementById("startMinute").value}`;
//     const end = `${document.getElementById("endHour").value}:${document.getElementById("endMinute").value}`;

//     const startTime = toMinutes(start);
//     const endTime = toMinutes(end);

//     const slotGroups = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;

//     for (let group of slotGroups) {
//       const minuteSlots = group.querySelectorAll(".minute-slot");

//       for (let slot of minuteSlots) {
//         const slotMinutes = toMinutes(slot.dataset.time);
//         if (slotMinutes >= startTime && slotMinutes < endTime) {
//           slot.classList.add(certainty === "definite" ? "busy-definite" : "busy-maybe");
//           slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;

//           let count = parseInt(slot.dataset.count || "0") + 1;
//           slot.dataset.count = count;

//           let groupCount = parseInt(group.dataset.count || "0");
//           let groupAlreadyCounted = false;

//           for (let slot of minuteSlots) {
//             const slotMinutes = toMinutes(slot.dataset.time);
//             if (slotMinutes >= startTime && slotMinutes < endTime) {
//               slot.classList.add(certainty === "definite" ? "busy-definite" : "busy-maybe");
//               slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;

//               // 개별 slot count는 유지
//               let count = parseInt(slot.dataset.count || "0") + 1;
//               slot.dataset.count = count;

//               if (!groupAlreadyCounted) {
//                 groupCount += 1;
//                 group.dataset.count = groupCount;
//                 updateIntensity(group, groupCount);
//                 groupAlreadyCounted = true;
//     }
//   }
// }

//         }
//       }
//     }

//     e.target.reset();
//   });


  document.getElementById("availabilityForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const date = document.getElementById("date").value;
    const certainty = document.getElementById("certainty").value;

    const start = `${document.getElementById("startHour").value}:${document.getElementById("startMinute").value}`;
    const end = `${document.getElementById("endHour").value}:${document.getElementById("endMinute").value}`;

    const startTime = toMinutes(start);
    const endTime = toMinutes(end);

    // 선택된 날짜의 모든 slot-group 순회
    const slotGroups = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;

    for (let group of slotGroups) {
      const minuteSlots = group.querySelectorAll(".minute-slot");

      for (let slot of minuteSlots) {
        const slotMinutes = toMinutes(slot.dataset.time);

        if (slotMinutes >= startTime && slotMinutes < endTime) {
          // 사용자가 이미 추가됐는지 확인 (중복 방지)
          const existing = slot.dataset.tooltip?.split(", ").includes(name);
          if (!existing) {
            slot.classList.add(certainty === "definite" ? "busy-definite" : "busy-maybe");

            slot.dataset.tooltip = slot.dataset.tooltip
              ? `${slot.dataset.tooltip}, ${name}`
              : name;

            let count = parseInt(slot.dataset.count || "0") + 1;
            slot.dataset.count = count;
          }
        }
      }

      // 🔁 모든 minuteSlot 기준으로 누적 count 다시 계산
      let countDefinite = 0;
      let countMaybe = 0;

      for (let slot of minuteSlots) {
        if (slot.classList.contains("busy-definite")) countDefinite++;
        if (slot.classList.contains("busy-maybe")) countMaybe++;
      }

      // 그룹 색상 갱신
      updateIntensity(group, countDefinite, countMaybe);
    }

    // 폼 초기화
    e.target.reset();
  });



  // 모임 정보 표시
  const info = JSON.parse(localStorage.getItem('meetingInfo')) || {};
  document.getElementById('meeting-name').textContent     = info.name || '';
  document.getElementById('meeting-location').textContent = info.location ? `장소: ${info.location}` : '';
  if (info.link) {
    const a = document.getElementById('meeting-link');
    a.href = info.link;
    a.textContent = info.link;
  }
});

// thirdpage용 스크립트 (페이지 로드 시 meetingInfo 적용)
window.addEventListener('DOMContentLoaded', () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo'));

  // 제목 설정
  const title = document.getElementById('meeting-title');
  if (info && info.name) {
    title.textContent = `${info.name}`;
  }
});


// script.js 제일 아래

function saveTimeData(userId, data) {
  firebase.database().ref("users/" + userId).set(data)
    .then(() => {
      console.log("저장 성공!");
    })
    .catch((error) => {
      console.error("저장 실패:", error);
    });
}

function getTimeData(userId) {
  firebase.database().ref("users/" + userId).once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log("불러온 데이터:", snapshot.val());
      } else {
        console.log("데이터 없음");
      }
    })
    .catch((error) => {
      console.error("불러오기 실패:", error);
    });
}


