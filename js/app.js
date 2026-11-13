
// =========================================
// QC PACKING HOUSE - APP
// =========================================

let isPetugas = false;

const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("sidebarBackdrop");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

function showSidebar() {
  sidebar?.classList.add("open");
  backdrop?.classList.add("show");
}

function hideSidebar() {
  sidebar?.classList.remove("open");
  backdrop?.classList.remove("show");
}

openSidebar?.addEventListener("click", showSidebar);
closeSidebar?.addEventListener("click", hideSidebar);
backdrop?.addEventListener("click", hideSidebar);

// SUBMENU PG
const calibrationMenu = document.getElementById("calibrationMenu");
const pgSubmenu = document.getElementById("pgSubmenu");

calibrationMenu?.addEventListener("click", () => {
  calibrationMenu.classList.toggle("expanded");
  pgSubmenu?.classList.toggle("show");
});

// LOGIN DIALOG
const loginDialog = document.getElementById("loginDialog");
const loginOpen = document.getElementById("loginOpen");
const loginClose = document.getElementById("loginClose");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginOpen?.addEventListener("click", () => {
  loginDialog?.showModal();
  hideSidebar();
});

loginClose?.addEventListener("click", () => {
  loginDialog?.close();
});

// TAMPILKAN STATUS AKSES
function updateAccessUI() {
  document.getElementById("accessLabel") &&
    (document.getElementById("accessLabel").textContent =
      isPetugas ? "Mode Petugas" : "Mode Pengunjung");

  document.getElementById("topAccess") &&
    (document.getElementById("topAccess").textContent =
      isPetugas ? "Petugas" : "Pengunjung");

  loginOpen?.classList.toggle("hidden", isPetugas);
  document.getElementById("logoutButton")?.classList.toggle(
    "hidden",
    !isPetugas
  );

  document.querySelectorAll(".petugas-only").forEach((element) => {
    element.classList.toggle("hidden", !isPetugas);
  });
}

// CEK SESSION
async function checkLogin() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  const user = data.session?.user;

  isPetugas = Boolean(
    user && user.app_metadata?.role === "petugas"
  );

  // Akun terdaftar tetapi bukan petugas tidak diberi akses
  if (user && !isPetugas) {
    await supabaseClient.auth.signOut();
  }

  updateAccessUI();
}

// PROSES LOGIN
loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginMessage.textContent = "Memeriksa akun...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginMessage.textContent = "Email atau password tidak sesuai.";
    return;
  }

  if (data.user?.app_metadata?.role !== "petugas") {
    await supabaseClient.auth.signOut();
    loginMessage.textContent = "Akun ini tidak memiliki akses petugas.";
    return;
  }

  isPetugas = true;
  updateAccessUI();
  loginDialog?.close();
  loginForm.reset();
  loginMessage.textContent = "";

  // Muat ulang halaman agar kontrol petugas ditampilkan
  location.reload();
});

// LOGOUT
document.getElementById("logoutButton")?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

// PERUBAHAN SESSION
supabaseClient.auth.onAuthStateChange((_event, session) => {
  const user = session?.user;

  isPetugas = Boolean(
    user && user.app_metadata?.role === "petugas"
  );

  updateAccessUI();
});

checkLogin();
