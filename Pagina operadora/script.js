// =========================
// CONFIGURACIÓN DE SUPABASE
// =========================
const supabaseUrl = "https://rgxybkmglfdxrgluzfwc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneHlia21nbGZkeHJnbHV6ZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDc3MzYsImV4cCI6MjEwMzc4MzczNn0.HhocvsjUxVuNW78sVTJmfNDJmrBb_TsU6KvIAscDsJI";

const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

const OWNER_NAME = "Heaven Ulabarri";
const OWNER_PASSWORD = "micielito0";
const OWNER_SESSION_KEY = "nailsSpaOwnerSession";

// Elementos del HTML
const ownerLoginForm = document.getElementById("ownerLoginForm");
const ownerSessionControls = document.getElementById("ownerSessionControls");
const ownerLoginSection = document.getElementById("ownerLoginSection");
const logoutOwnerBtn = document.getElementById("logoutOwnerBtn");

// Secciones ocultas para el cliente
const ownerOnlySections = Array.from(
  document.querySelectorAll(".owner-only, #adminSection, #availabilitySection, #agendaSection")
);

// Toast / mensaje
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function isOwnerUnlocked() {
  const savedSession = localStorage.getItem(OWNER_SESSION_KEY);

  if (!savedSession) {
    return localStorage.getItem("nailsSpaOwner") === "true";
  }

  try {
    const parsed = JSON.parse(savedSession);
    return parsed.username === OWNER_NAME && parsed.password === OWNER_PASSWORD;
  } catch (error) {
    return false;
  }
}

function setOwnerAccess(isUnlocked) {
  localStorage.setItem("nailsSpaOwner", isUnlocked ? "true" : "false");

  if (isUnlocked) {
    localStorage.setItem(
      OWNER_SESSION_KEY,
      JSON.stringify({
        username: OWNER_NAME,
        password: OWNER_PASSWORD
      })
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
  if (username === OWNER_NAME && password === OWNER_PASSWORD) {
    setOwnerAccess(true);
    showToast("Bienvenido, Heaven.");
    return true;
  }

  showToast("Usuario o contraseña incorrectos.");
  return false;
}

function lockOwnerAccess() {
  setOwnerAccess(false);
  showToast("Sesión cerrada.");
}

function setupOwnerLogin() {
  if (!ownerLoginForm) return;

  ownerLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(ownerLoginForm);
    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();

    unlockOwnerAccess(username, password);
  });
}

function setupOwnerLogout() {
  if (!logoutOwnerBtn) return;

  logoutOwnerBtn.addEventListener("click", () => {
    lockOwnerAccess();
  });
}

function applyOwnerAccessState() {
  const unlocked = isOwnerUnlocked();
  setOwnerAccess(unlocked);
}

document.addEventListener("DOMContentLoaded", () => {
  setupOwnerLogin();
  setupOwnerLogout();
  applyOwnerAccessState();
});
// =========================
// CARGAR DISPONIBILIDAD
// =========================
function getTodayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  renderAvailabilityUI(data || []);
}

function renderAvailabilityUI(slots) {
  const calendarRoot = document.getElementById("calendar");
  const slotList = document.getElementById("slotList");
  const dateSelect = document.getElementById("dateSelect");

  if (!calendarRoot && !slotList && !dateSelect) return;

  const uniqueDates = [...new Set(slots.map((slot) => slot.date))];

  if (dateSelect) {
    dateSelect.innerHTML = '<option value="">Selecciona una fecha</option>';
    uniqueDates.forEach((date) => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = formatDateForDisplay(date);
      dateSelect.appendChild(option);
    });
  }

  if (calendarRoot) {
    calendarRoot.innerHTML = "";

    uniqueDates.forEach((date) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      btn.dataset.date = date;
      btn.textContent = formatDateForDisplay(date);

      btn.addEventListener("click", () => {
        document.querySelectorAll(".calendar-day").forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        renderTimeSlotsForDate(date, slots);
      });

      calendarRoot.appendChild(btn);
    });

    if (uniqueDates.length > 0) {
      const firstDate = uniqueDates[0];
      const firstBtn = calendarRoot.querySelector(`[data-date="${firstDate}"]`);
      if (firstBtn) firstBtn.click();
    }
  }

  if (slotList && !calendarRoot) {
    const selectedDate = dateSelect?.value || uniqueDates[0];
    if (selectedDate) {
      renderTimeSlotsForDate(selectedDate, slots);
    }
  }
}

function renderTimeSlotsForDate(date, slots) {
  const slotList = document.getElementById("slotList");
  const selectedSlotInput = document.getElementById("selectedSlot");

  if (!slotList) return;

  const availableSlots = slots.filter(
    (slot) => slot.date === date && slot.is_available === true
  );

  slotList.innerHTML = "";

  if (!availableSlots.length) {
    slotList.innerHTML = `<p class="empty-state">No hay horarios disponibles para esta fecha.</p>`;
    if (selectedSlotInput) selectedSlotInput.value = "";
    return;
  }

  availableSlots.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = slot.time;
    btn.dataset.date = slot.date;
    btn.dataset.time = slot.time;
    btn.dataset.slotId = slot.id;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".slot-btn").forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");

      if (selectedSlotInput) {
        selectedSlotInput.value = `${slot.date} ${slot.time}`;
      }
    });

    slotList.appendChild(btn);
  });
}

// =========================
// AGENDAR CITA
// =========================
async function submitBooking(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.querySelector("#clientName")?.value?.trim();
  const phone = form.querySelector("#clientPhone")?.value?.trim();
  const email = form.querySelector("#clientEmail")?.value?.trim();
  const service = form.querySelector("#serviceSelect")?.value;
  const notes = form.querySelector("#clientNotes")?.value?.trim();
  const selectedSlot = document.getElementById("selectedSlot")?.value;

  if (!name || !phone || !email || !service || !selectedSlot) {
    showToast("Completa todos los campos y selecciona una fecha y hora", "error");
    return;
  }

  const [date, time] = selectedSlot.split(" ");

  if (!date || !time) {
    showToast("Selecciona una fecha y hora válidas", "error");
    return;
  }

  const { data: slotData, error: slotError } = await sb
    .from("availability")
    .select("*")
    .eq("date", date)
    .eq("time", time)
    .single();

  if (slotError || !slotData) {
    showToast("Ese horario ya no está disponible", "error");
    await loadAvailability();
    return;
  }

  if (slotData.is_available !== true) {
    showToast("Ese horario ya fue reservado", "error");
    await loadAvailability();
    return;
  }

  const payload = {
    name,
    phone,
    email,
    service,
    date,
    time,
    notes: notes || "",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("appointments")
    .insert([payload])
    .select();

  if (error) {
    console.error("Error insertando cita:", error);
    showToast("No se pudo guardar la cita", "error");
    return;
  }

  const { error: updateError } = await sb
    .from("availability")
    .update({
      is_available: false,
      booked_by: data?.[0]?.id || null,
    })
    .eq("id", slotData.id);

  if (updateError) {
    console.error("Error actualizando disponibilidad:", updateError);
  }

  form.reset();

  const selectedSlotInput = document.getElementById("selectedSlot");
  if (selectedSlotInput) selectedSlotInput.value = "";

  showToast("Cita agendada correctamente");
  await loadAvailability();
  await loadAppointments();
}

// =========================
// AGENDAS PENDIENTES
// =========================
async function loadAppointments() {
  const container = document.getElementById("pendingAppointments");
  if (!container) return;

  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading appointments:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p class='empty-state'>No hay agendas pendientes.</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach((appointment) => {
    const card = document.createElement("div");
    card.className = "appointment-card";

    card.innerHTML = `
      <div class="appointment-header">
        <div>
          <strong>${appointment.name}</strong>
          <small>${appointment.service}</small>
        </div>
        <span class="badge pending">Pendiente</span>
      </div>

      <div class="appointment-body">
        <p><strong>Tel:</strong> ${appointment.phone}</p>
        <p><strong>Email:</strong> ${appointment.email}</p>
        <p><strong>Fecha:</strong> ${appointment.date}</p>
        <p><strong>Hora:</strong> ${appointment.time}</p>
        <p><strong>Notas:</strong> ${appointment.notes || "Sin notas"}</p>
      </div>

      <div class="appointment-actions">
        <button type="button" class="mark-done-btn" data-id="${appointment.id}">
          Agenda atendida
        </button>
        <button type="button" class="cancel-btn" data-id="${appointment.id}">
          Cancelar
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  bindAppointmentActions();
}

// =========================
// AGENDAS REGISTRADAS
// =========================
async function loadRegisteredAppointments() {
  const container = document.getElementById("registeredAppointments");
  if (!container) return;

  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .in("status", ["done", "cancelled"])
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading registered appointments:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p class='empty-state'>No hay agendas registradas.</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach((appointment) => {
    const card = document.createElement("div");
    card.className = "appointment-card registered";

    const stateLabel = appointment.status === "done" ? "Atendida" : "Cancelada";

    card.innerHTML = `
      <div class="appointment-header">
        <div>
          <strong>${appointment.name}</strong>
          <small>${appointment.service}</small>
        </div>
        <span class="badge ${appointment.status === "done" ? "done" : "cancelled"}">${stateLabel}</span>
      </div>

      <div class="appointment-body">
        <p><strong>Tel:</strong> ${appointment.phone}</p>
        <p><strong>Email:</strong> ${appointment.email}</p>
        <p><strong>Fecha:</strong> ${appointment.date}</p>
        <p><strong>Hora:</strong> ${appointment.time}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// =========================
// ACCIONES DE AGENDA
// =========================
function bindAppointmentActions() {
  document.querySelectorAll(".mark-done-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      if (!id) return;

      const { error } = await sb
        .from("appointments")
        .update({
          status: "done",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error al marcar como atendida:", error);
        showToast("No se pudo marcar la cita", "error");
        return;
      }

      showToast("Agenda marcada como atendida");
      await loadAppointments();
      await loadRegisteredAppointments();
    });
  });

  document.querySelectorAll(".cancel-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      if (!id) return;

      const { error } = await sb
        .from("appointments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error al cancelar cita:", error);
        showToast("No se pudo cancelar la cita", "error");
        return;
      }

      const { data: appointment } = await sb
        .from("appointments")
        .select("date, time")
        .eq("id", id)
        .single();

      if (appointment) {
        await sb
          .from("availability")
          .update({
            is_available: true,
            booked_by: null,
          })
          .eq("date", appointment.date)
          .eq("time", appointment.time);
      }

      showToast("Cita cancelada");
      await loadAppointments();
      await loadRegisteredAppointments();
      await loadAvailability();
    });
  });
}

// =========================
// LOGIN DEL ADMIN
// =========================
function setupOwnerLogin() {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("adminUser")?.value?.trim();
    const password = document.getElementById("adminPassword")?.value;

    if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
      setOwnerSession(true);
      showOwnerPanel();
      showToast("Sesión iniciada correctamente");
      form.reset();
      return;
    }

    showToast("Usuario o contraseña incorrectos", "error");
  });
}

function showOwnerPanel() {
  const panel = document.getElementById("ownerPanel");
  const adminAccess = document.getElementById("adminAccess");
  const loginBox = document.getElementById("loginBox");

  if (!panel) return;

  if (isOwnerLoggedIn()) {
    panel.classList.remove("hidden");
    if (adminAccess) adminAccess.classList.remove("hidden");
    if (loginBox) loginBox.classList.add("hidden");
  } else {
    panel.classList.add("hidden");
    if (adminAccess) adminAccess.classList.add("hidden");
    if (loginBox) loginBox.classList.remove("hidden");
  }
}

function logoutOwner() {
  setOwnerSession(false);
  showOwnerPanel();
  showToast("Sesión cerrada");
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", logoutOwner);
}

// =========================
// REDES SOCIALES
// =========================
async function loadSocialLinks() {
  const container = document.getElementById("socialLinks");
  if (!container) return;

  const { data, error } = await sb
    .from("social_links")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error loading social links:", error);
    return;
  }

  if (!data || data.length === 0) return;

  container.innerHTML = "";

  data.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "social-btn";
    a.textContent = link.label;
    container.appendChild(a);
  });
}

// =========================
// INICIALIZAR
// =========================
async function initSupabaseApp() {
  setupOwnerLogin();
  setupLogoutButton();
  showOwnerPanel();

  if (document.getElementById("bookingForm")) {
    const bookingForm = document.getElementById("bookingForm");
    bookingForm.addEventListener("submit", submitBooking);
  }

  await loadAvailability();

  if (isOwnerLoggedIn()) {
    await loadAppointments();
    await loadRegisteredAppointments();
  }

  await loadSocialLinks();
}

document.addEventListener("DOMContentLoaded", initSupabaseApp);


