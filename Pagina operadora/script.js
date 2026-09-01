const supabaseUrl = "https://rgxybkmglfdxrgluzfwc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneHlia21nbGZkeHJnbHV6ZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDc3MzYsImV4cCI6MjEwMzc4MzczNn0.HhocvsjUxVuNW78sVTJmfNDJmrBb_TsU6KvIAscDsJI";

const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("bookingForm");
const toast = document.getElementById("toast");
const creatorEmail = "heavenulabarri@gmail.com";

const appointmentsList = document.getElementById("appointmentsList");
const appointmentsCount = document.getElementById("appointmentsCount");
const exportAppointmentsBtn = document.getElementById("exportAppointments");
const registeredAppointmentsList = document.getElementById("registeredAppointmentsList");
const registeredAppointmentsCount = document.getElementById("registeredAppointmentsCount");

const availabilityForm = document.getElementById("availabilityForm");
const availabilityList = document.getElementById("availabilityList");
const calendarDays = document.getElementById("calendarDays");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const slotOptions = document.getElementById("slotOptions");
const selectedDateInput = document.getElementById("selectedDate");
const selectedTimeInput = document.getElementById("selectedTime");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const ownerLoginForm = document.getElementById("ownerLoginForm");
const ownerSessionControls = document.getElementById("ownerSessionControls");
const logoutOwnerBtn = document.getElementById("logoutOwnerBtn");
const ownerLoginSection = document.getElementById("adminLoginSection");
const ownerOnlySections = document.querySelectorAll(".owner-only");

const OWNER_NAME = "Heaven Ulabarri";
const OWNER_PASSWORD = "micielito";
const LEGACY_OWNER_PASSWORD = "micielito0";
const OWNER_SESSION_KEY = "nailsSpaOwnerSession";

const state = {
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: "",
  selectedTime: "",
  availability: [],
  pendingAppointments: [],
  handledAppointments: []
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "success") {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  toast.dataset.type = type;

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function getTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function toDateKey(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

function formatTimeLabel(timeString) {
  if (!timeString) return "Sin hora";
  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function isOwnerUnlocked() {
  const savedSession = localStorage.getItem(OWNER_SESSION_KEY);
  if (!savedSession) {
    return localStorage.getItem("nailsSpaOwner") === "true";
  }

  try {
    const parsed = JSON.parse(savedSession);
    const storedPassword = parsed.password || "";
    return (
      parsed.username === OWNER_NAME &&
      (storedPassword === OWNER_PASSWORD || storedPassword === LEGACY_OWNER_PASSWORD)
    );
  } catch (error) {
    return false;
  }
}

function setOwnerAccess(isUnlocked) {
  localStorage.setItem("nailsSpaOwner", isUnlocked ? "true" : "false");

  if (isUnlocked) {
    localStorage.setItem(
      OWNER_SESSION_KEY,
      JSON.stringify({ username: OWNER_NAME, password: OWNER_PASSWORD })
    );
  } else {
    localStorage.removeItem(OWNER_SESSION_KEY);
  }

  ownerOnlySections.forEach((section) => {
    section.classList.toggle("hidden", !isUnlocked);
  });

  if (ownerLoginForm) {
    ownerLoginForm.classList.toggle("hidden", isUnlocked);
  }

  if (ownerSessionControls) {
    ownerSessionControls.classList.toggle("hidden", !isUnlocked);
  }

  if (ownerLoginSection) {
    ownerLoginSection.classList.toggle("hidden", isUnlocked);
  }
}

function unlockOwnerAccess(username, password) {
  const safeUsername = String(username || "").trim();
  const safePassword = String(password || "").trim();

  if (
    safeUsername === OWNER_NAME &&
    (safePassword === OWNER_PASSWORD || safePassword === LEGACY_OWNER_PASSWORD)
  ) {
    setOwnerAccess(true);
    showToast("Bienvenido, Heaven.");
    return true;
  }

  showToast("Usuario o contraseña incorrectos.", "error");
  return false;
}

function lockOwnerAccess() {
  setOwnerAccess(false);
  showToast("Sesión cerrada.");
}

function buildAppointmentMessage(appointment, action = "Nueva cita agendada") {
  return [
    `${action} en Nails SPA.`,
    "",
    "Nombre completo: " + appointment.name,
    "Teléfono: " + appointment.phone,
    "Servicio: " + appointment.service,
    "Fecha: " + appointment.date,
    "Hora: " + appointment.time,
    "Detalles: " + (appointment.notes || "Sin detalles adicionales"),
    "",
    "Creado: " + new Date(appointment.created_at || Date.now()).toLocaleString("es-MX"),
    "Gracias."
  ].join("\n");
}

function sendEmail(subject, body) {
  const mailtoUrl = `mailto:${creatorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

async function loadAvailability() {
  const today = getTodayISO();

  const { data, error } = await sb
    .from("availability")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error("Error loading availability:", error);
    showToast("No se pudo cargar la disponibilidad", "error");
    return;
  }

  state.availability = data || [];

  if (!state.availability.length) {
    const seedSlots = [];

    for (let i = 1; i <= 7; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dateKey = toDateKey(date);

      ["10:00", "12:00", "15:00", "17:30"].forEach((time) => {
        seedSlots.push({
          date: dateKey,
          time,
          is_available: true
        });
      });
    }

    const { error: insertError } = await sb
      .from("availability")
      .insert(seedSlots);

    if (insertError) {
      console.error("Error seeding default availability:", insertError);
      showToast("No se pudieron crear horarios iniciales", "error");
      return;
    }

    const retry = await sb
      .from("availability")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    state.availability = retry.data || [];
  }

  renderAvailabilityList();
  renderCalendar();

  if (!state.selectedDate && state.availability.length) {
    state.selectedDate = state.availability[0].date;
    state.selectedTime = state.availability[0].time;
    if (selectedDateInput) selectedDateInput.value = state.selectedDate;
    if (selectedTimeInput) selectedTimeInput.value = state.selectedTime;
  }

  if (state.selectedDate) {
    renderSlotOptions(state.selectedDate);
  }
}

async function loadAppointments() {
  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading appointments:", error);
    showToast("No se pudo cargar la agenda.", "error");
    return;
  }

  state.pendingAppointments = (data || []).filter((item) => item.status !== "handled");
  state.handledAppointments = (data || []).filter((item) => item.status === "handled");

  if (appointmentsCount) {
    appointmentsCount.textContent = `${state.pendingAppointments.length} cita${state.pendingAppointments.length === 1 ? "" : "s"}`;
  }

  if (!appointmentsList) return;

  if (!state.pendingAppointments.length) {
    appointmentsList.innerHTML = '<p class="empty-state">No hay citas agendadas todavía.</p>';
    return;
  }

  appointmentsList.innerHTML = state.pendingAppointments
    .map(
      (appointment) => `
        <article class="appointment-card">
          <div>
            <h3>${escapeHtml(appointment.name)}</h3>
            <div class="appointment-details">
              <span><strong>Tel:</strong> ${escapeHtml(appointment.phone)}</span>
              <span><strong>Servicio:</strong> ${escapeHtml(appointment.service)}</span>
              <span><strong>Fecha:</strong> ${escapeHtml(formatDate(appointment.date))}</span>
              <span><strong>Hora:</strong> ${escapeHtml(formatTimeLabel(appointment.time))}</span>
              <span><strong>Notas:</strong> ${escapeHtml(appointment.notes || "Sin detalles")}</span>
            </div>
          </div>
          <div class="appointment-actions">
            <button type="button" class="cancel-btn" data-id="${appointment.id}">Cancelar</button>
            <button type="button" class="attended-btn" data-id="${appointment.id}">Agenda atendida</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadRegisteredAppointments() {
  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .eq("status", "handled")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading handled appointments:", error);
    return;
  }

  state.handledAppointments = data || [];

  if (registeredAppointmentsCount) {
    registeredAppointmentsCount.textContent = `${state.handledAppointments.length} agenda${state.handledAppointments.length === 1 ? "" : "s"}`;
  }

  if (!registeredAppointmentsList) return;

  if (!state.handledAppointments.length) {
    registeredAppointmentsList.innerHTML = '<p class="empty-state">Aún no hay agendas atendidas.</p>';
    return;
  }

  registeredAppointmentsList.innerHTML = state.handledAppointments
    .map(
      (appointment) => `
        <article class="appointment-card">
          <div>
            <h3>${escapeHtml(appointment.name)}</h3>
            <div class="appointment-details">
              <span><strong>Tel:</strong> ${escapeHtml(appointment.phone)}</span>
              <span><strong>Servicio:</strong> ${escapeHtml(appointment.service)}</span>
              <span><strong>Fecha:</strong> ${escapeHtml(formatDate(appointment.date))}</span>
              <span><strong>Hora:</strong> ${escapeHtml(formatTimeLabel(appointment.time))}</span>
              <span><strong>Notas:</strong> ${escapeHtml(appointment.notes || "Sin detalles")}</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function getAvailableSlots() {
  return state.availability.filter((slot) => slot.is_available !== false);
}

function renderAvailabilityList() {
  if (!availabilityList) return;

  const slots = getAvailableSlots();

  if (!slots.length) {
    availabilityList.innerHTML = '<p class="empty-state">No hay horarios disponibles por el momento.</p>';
    return;
  }

  availabilityList.innerHTML = slots
    .map(
      (slot) => `
        <div class="availability-pill">
          <span>${escapeHtml(formatDate(slot.date))} · ${escapeHtml(formatTimeLabel(slot.time))}</span>
          <button type="button" class="remove-slot-btn" data-slot-id="${slot.id}" aria-label="Eliminar horario">×</button>
        </div>
      `
    )
    .join("");
}

function renderCalendar() {
  if (!calendarDays || !calendarMonthLabel) return;

  const monthStart = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1);
  const monthLabel = monthStart.toLocaleString("es-MX", { month: "long", year: "numeric" });
  calendarMonthLabel.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const firstDay = new Date(monthStart);
  firstDay.setDate(1 - monthStart.getDay());

  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    days.push(date);
  }

  const availableDates = new Set(getAvailableSlots().map((slot) => slot.date));

  const calendarMarkup = days
    .map((date) => {
      const dateKey = toDateKey(date);
      const isCurrentMonth = date.getMonth() === monthStart.getMonth();
      const isSelected = state.selectedDate === dateKey;
      const hasSlots = availableDates.has(dateKey);
      const classes = ["calendar-day"];

      if (!isCurrentMonth) classes.push("outside-month");
      if (hasSlots) classes.push("has-slots");
      if (isSelected) classes.push("selected");

      return `
        <button
          type="button"
          class="${classes.join(" ")}"
          data-date="${dateKey}"
          ${!isCurrentMonth ? "disabled" : ""}
        >
          ${date.getDate()}
        </button>
      `;
    })
    .join("");

  calendarDays.innerHTML = calendarMarkup;
}

function renderSlotOptions(dateKey) {
  if (!slotOptions) return;

  const slots = getAvailableSlots().filter((slot) => slot.date === dateKey);
  slotOptions.innerHTML = "";

  if (!slots.length) {
    slotOptions.innerHTML = '<button type="button" class="slot-btn empty" disabled>No hay horarios disponibles</button>';
    state.selectedTime = "";
    if (selectedTimeInput) selectedTimeInput.value = "";
    return;
  }

  slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slot-btn${state.selectedTime === slot.time ? " selected" : ""}`;
    button.textContent = formatTimeLabel(slot.time);
    button.dataset.date = slot.date;
    button.dataset.time = slot.time;
    slotOptions.appendChild(button);
  });

  if (!slots.some((slot) => slot.time === state.selectedTime)) {
    state.selectedTime = slots[0].time;
  }

  if (selectedTimeInput) selectedTimeInput.value = state.selectedTime;

  Array.from(slotOptions.querySelectorAll(".slot-btn")).forEach((button) => {
    const isSelected = button.dataset.time === state.selectedTime;
    button.classList.toggle("selected", isSelected);
  });
}

function updateSelectedDate(dateKey) {
  state.selectedDate = dateKey;
  if (selectedDateInput) selectedDateInput.value = dateKey;

  const availableSlots = getAvailableSlots().filter((slot) => slot.date === dateKey);
  state.selectedTime = availableSlots.length ? availableSlots[0].time : "";
  if (selectedTimeInput) selectedTimeInput.value = state.selectedTime;

  renderCalendar();
  renderSlotOptions(dateKey);
}

async function addAvailabilitySlot(event) {
  event.preventDefault();

  const formData = new FormData(availabilityForm);
  const date = String(formData.get("slotDate") || "").trim();
  const time = String(formData.get("slotTime") || "").trim();

  if (!date || !time) {
    showToast("Agrega una fecha y una hora válida.", "error");
    return;
  }

  const { data: existingSlot, error: checkError } = await sb
    .from("availability")
    .select("*")
    .eq("date", date)
    .eq("time", time)
    .maybeSingle();

  if (checkError) {
    console.error("Error al comprobar slot:", checkError);
    showToast("No se pudo validar el horario.", "error");
    return;
  }

  if (existingSlot) {
    const { error } = await sb
      .from("availability")
      .update({ is_available: true, booked_by: null })
      .eq("id", existingSlot.id);

    if (error) {
      console.error("Error actualizando horario:", error);
      showToast("No se pudo actualizar el horario.", "error");
      return;
    }

    showToast("Horario actualizado correctamente.");
  } else {
    const { error } = await sb.from("availability").insert([
      {
        date,
        time,
        is_available: true,
        booked_by: null
      }
    ]);

    if (error) {
      console.error("Error insertando horario:", error);
      showToast("No se pudo guardar el horario.", "error");
      return;
    }

    showToast("Horario agregado correctamente.");
  }

  availabilityForm.reset();
  await loadAvailability();
}

async function removeAvailabilitySlot(slotId) {
  const { error } = await sb.from("availability").delete().eq("id", slotId);

  if (error) {
    console.error("Error eliminando horario:", error);
    showToast("No se pudo eliminar el horario.", "error");
    return;
  }

  showToast("Horario eliminado.");
  await loadAvailability();
}

async function submitBooking(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const name = formData.get("name")?.toString().trim() || "Cliente";
  const phone = formData.get("phone")?.toString().trim() || "Sin teléfono";
  const service = formData.get("service")?.toString().trim() || "servicio";
  const date = String(formData.get("date") || "").trim() || state.selectedDate;
  const time = String(formData.get("time") || "").trim() || state.selectedTime;
  const notes = formData.get("notes")?.toString().trim() || "";

  if (!date || !time) {
    showToast("Selecciona un día y una hora disponible.", "error");
    return;
  }

  const { data: slot, error: slotError } = await sb
    .from("availability")
    .select("*")
    .eq("date", date)
    .eq("time", time)
    .maybeSingle();

  if (slotError) {
    console.error("Error consultando slot:", slotError);
    showToast("No se pudo validar la disponibilidad.", "error");
    return;
  }

  if (!slot || slot.is_available === false) {
    showToast("Ese horario ya no está disponible. Elige otro.", "error");
    await loadAvailability();
    return;
  }

  const appointment = {
    name,
    phone,
    service,
    date,
    time,
    notes,
    status: "pending",
    created_at: new Date().toISOString()
  };

  const { error: insertError } = await sb.from("appointments").insert([appointment]);

  if (insertError) {
    console.error("Error creando cita:", insertError);
    showToast("No se pudo agendar la cita.", "error");
    return;
  }

  const { error: updateError } = await sb
    .from("availability")
    .update({ is_available: false, booked_by: name })
    .eq("id", slot.id);

  if (updateError) {
    console.error("Error bloqueando disponibilidad:", updateError);
  }

  sendEmail(
    `Nueva cita agendada - ${name}`,
    buildAppointmentMessage(
      {
        ...appointment,
        created_at: appointment.created_at
      },
      "Se ha agendado una nueva cita"
    )
  );

  form.reset();
  state.selectedDate = "";
  state.selectedTime = "";
  if (selectedDateInput) selectedDateInput.value = "";
  if (selectedTimeInput) selectedTimeInput.value = "";

  await loadAvailability();
  if (isOwnerUnlocked()) {
    await loadAppointments();
  }

  showToast(`¡Gracias ${name}! Tu cita para ${service} quedó agendada.`);
}

async function cancelAppointment(appointmentId) {
  const { error } = await sb
    .from("appointments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) {
    console.error("Error cancelando cita:", error);
    showToast("No se pudo cancelar la cita.", "error");
    return;
  }

  showToast("Cita cancelada.");
  await loadAppointments();
  await loadRegisteredAppointments();
}

async function markAppointmentAsHandled(appointmentId) {
  const { error } = await sb
    .from("appointments")
    .update({ status: "handled", updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) {
    console.error("Error marcando como atendida:", error);
    showToast("No se pudo registrar la cita.", "error");
    return;
  }

  showToast("La agenda fue marcada como atendida.");
  await loadAppointments();
  await loadRegisteredAppointments();
}

async function exportAppointmentsByEmail() {
  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .neq("status", "handled")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error exportando citas:", error);
    showToast("No se pudo exportar la agenda.", "error");
    return;
  }

  if (!data || !data.length) {
    showToast("No hay citas para exportar.");
    return;
  }

  const text = data
    .map((appointment, index) => {
      return [
        `Cita ${index + 1}`,
        "Nombre: " + appointment.name,
        "Teléfono: " + appointment.phone,
        "Servicio: " + appointment.service,
        "Fecha: " + appointment.date,
        "Hora: " + appointment.time,
        "Notas: " + (appointment.notes || "Sin detalles"),
        ""
      ].join("\n");
    })
    .join("\n");

  sendEmail("Resumen de citas agendadas", "Estas son las citas activas:\n\n" + text);
}

function setupOwnerLogin() {
  if (!ownerLoginForm) return;

  ownerLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(ownerLoginForm);
    const username = (formData.get("username") || "").toString().trim();
    const password = (formData.get("password") || "").toString();

    if (!username || !password) {
      showToast("Ingresa usuario y contraseña.", "error");
      return;
    }

    const success = unlockOwnerAccess(username, password);

    if (success) {
      ownerLoginForm.reset();
    }
  });
}

function setupLogoutButton() {
  if (!logoutOwnerBtn) return;

  logoutOwnerBtn.addEventListener("click", () => {
    lockOwnerAccess();
  });
}

async function initSupabaseApp() {
  setupOwnerLogin();
  setupLogoutButton();
  setOwnerAccess(isOwnerUnlocked());

  if (availabilityForm) {
    availabilityForm.addEventListener("submit", addAvailabilitySlot);
  }

  if (form) {
    form.addEventListener("submit", submitBooking);
  }

  if (exportAppointmentsBtn) {
    exportAppointmentsBtn.addEventListener("click", exportAppointmentsByEmail);
  }

  document.addEventListener("click", async (event) => {
    const cancelButton = event.target.closest(".cancel-btn");
    if (cancelButton) {
      await cancelAppointment(cancelButton.dataset.id);
      return;
    }

    const attendedButton = event.target.closest(".attended-btn");
    if (attendedButton) {
      await markAppointmentAsHandled(attendedButton.dataset.id);
      return;
    }

    const removeSlotButton = event.target.closest(".remove-slot-btn");
    if (removeSlotButton) {
      await removeAvailabilitySlot(removeSlotButton.dataset.slotId);
      return;
    }

    const calendarDay = event.target.closest(".calendar-day");
    if (calendarDay) {
      const dateKey = calendarDay.dataset.date;
      if (dateKey) {
        updateSelectedDate(dateKey);
      }
      return;
    }

    const slotButton = event.target.closest(".slot-btn");
    if (slotButton && !slotButton.disabled && !slotButton.classList.contains("empty")) {
      state.selectedTime = slotButton.dataset.time;
      if (selectedTimeInput) selectedTimeInput.value = state.selectedTime;
      renderSlotOptions(state.selectedDate);
    }
  });

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      state.currentMonth = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth() - 1,
        1
      );
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      state.currentMonth = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth() + 1,
        1
      );
      renderCalendar();
    });
  }

  await loadAvailability();

  if (isOwnerUnlocked()) {
    await loadAppointments();
    await loadRegisteredAppointments();
  }
}

initSupabaseApp();
