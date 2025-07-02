const generateSlots = () => {
  const startHour = 9;
  const endHour = 22;
  document.querySelectorAll(".time-slots").forEach(container => {
    for (let h = startHour; h < endHour; h++) {
      container.appendChild(createSlot(`${String(h).padStart(2, '0')}:00`));
      container.appendChild(createSlot(`${String(h).padStart(2, '0')}:30`));
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
  slot.classList.remove("intensity-2", "intensity-3", "intensity-4", "intensity-5");
  if (count >= 5) slot.classList.add("intensity-5");
  else if (count === 4) slot.classList.add("intensity-4");
  else if (count === 3) slot.classList.add("intensity-3");
  else if (count === 2) slot.classList.add("intensity-2");
};

document.getElementById("availabilityForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const timeRange = document.getElementById("time").value.trim();
  const date = document.getElementById("date").value;
  const certainty = document.getElementById("certainty").value;

  const [start, end] = timeRange.split("~").map(t => t.trim());
  const slotElems = document.querySelector(`.day-column[data-date="${date}"] .time-slots`).children;

  let mark = false;
  for (let slot of slotElems) {
    const slotTime = slot.dataset.time;
    if (slotTime === start) mark = true;
    if (mark) {
      const cls = certainty === "definite" ? "busy-definite" : "busy-maybe";
      slot.classList.add(cls);

      const prev = slot.dataset.tooltip;
      slot.dataset.tooltip = prev ? `${prev}, ${name}` : name;

      let count = parseInt(slot.dataset.count);
      slot.dataset.count = count + 1;
      updateIntensity(slot);
    }
    if (slotTime === end) break;
  }

  e.target.reset();
});

generateSlots();
