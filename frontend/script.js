// 1) 타임슬롯 생성 로직 (기존 코드)
const generateSlots = () => {
  const startHour = 9, endHour = 22;
  document.querySelectorAll(".time-slots").forEach(container => {
    for (let h = startHour; h < endHour; h++) {
      container.appendChild(createSlot(`${String(h).padStart(2,'0')}:00`));
      container.appendChild(createSlot(`${String(h).padStart(2,'0')}:30`));
    }
  });
};

const createSlot = (time) => {
  const div = document.createElement("div");
  div.classList.add("slot");
  div.dataset.time = time;
  div.dataset.tooltip = "";
  div.dataset.count = 0;
  div.innerHTML = `<span>${time}</span>`;
  return div;
};

const updateIntensity = (slot) => {
  const count = parseInt(slot.dataset.count);
  slot.classList.remove("intensity-2","intensity-3","intensity-4","intensity-5");
  if      (count>=5) slot.classList.add("intensity-5");
  else if (count===4) slot.classList.add("intensity-4");
  else if (count===3) slot.classList.add("intensity-3");
  else if (count===2) slot.classList.add("intensity-2");
};

// 2) 사용자가 직접 시간 등록할 때의 기존 로직
document.getElementById("availabilityForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const timeRange = document.getElementById("time").value.trim();
  const date = document.getElementById("date").value;
  const certainty = document.getElementById("certainty").value;
  const [start,end] = timeRange.split("~").map(t => t.trim());
  const slots = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;
  let marking = false;
  for (let slot of slots) {
    if (slot.dataset.time === start) marking = true;
    if (marking) {
      const cls = certainty==="definite" ? "busy-definite" : "busy-maybe";
      slot.classList.add(cls);
      slot.dataset.tooltip = slot.dataset.tooltip ? `${slot.dataset.tooltip}, ${name}` : name;
      slot.dataset.count = parseInt(slot.dataset.count)+1;
      updateIntensity(slot);
    }
    if (slot.dataset.time === end) break;
  }
  e.target.reset();
});

// 3) 슬롯 생성
generateSlots();

// 4) secondpage에서 넘어온 meetingInfo를 표시
document.addEventListener('DOMContentLoaded', () => {
  const info = JSON.parse(localStorage.getItem('meetingInfo'));
  if (!info) return;

  // 모임 이름
  document.getElementById('meeting-name').textContent = info.name || '';

  // 장소
  document.getElementById('meeting-location').textContent =
    info.location ? `장소: ${info.location}` : '';

  // 링크
  if (info.link) {
    const a = document.getElementById('meeting-link');
    a.textContent = info.link;
    a.href = info.link;
  }

  // 더 이상 필요 없으면 주석 해제
  // localStorage.removeItem('meetingInfo');
});
