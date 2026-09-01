// =========================
// CONFIGURACIÓN DE SUPABASE
// =========================
const supabaseUrl = "https://rgxybkmglfdxrgluzfwc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneHlia21nbGZkeHJnbHV6ZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDc3MzYsImV4cCI6MjEwMzc4MzczNn0.HhocvsjUxVuNW78sVTJmfNDJmrBb_TsU6KvIAscDsJI";

const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

// =========================
// LOGIN DEL DUEÑO
// =========================
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


