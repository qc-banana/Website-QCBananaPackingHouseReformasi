
// =========================================
// CALIBRATION PAGE
// =========================================

const currentPG = document.body.dataset.pg;
const callSizes = [
  "<36",
  ...Array.from({ length: 15 }, (_, i) => String(i + 36)),
  ">50"
];

let pgRecords = [];
let phRecords = [];
let editing = null;
let calibrationChart = null;
let phChart = null;

const $ = (id) => document.getElementById(id);

function groupCounts(counts) {
  let uc = 0;
  let good = 0;
  let oc = 0;
  let total = 0;

  callSizes.forEach((size) => {
    const amount = Number(counts[size] || 0);
    total += amount;

    if (size === "<36" || Number(size) <= 42) {
      uc += amount;
    } else if (size === ">50" || Number(size) >= 47) {
      oc += amount;
    } else {
      good += amount;
    }
  });

  return {
    total,
    uc,
    good,
    oc,
    ucPercent: total ? +(uc / total * 100).toFixed(2) : 0,
    goodPercent: total ? +(good / total * 100).toFixed(2) : 0,
    ocPercent: total ? +(oc / total * 100).toFixed(2) : 0
  };
}

function makeFormRows() {
  $("callInputRows").innerHTML = callSizes.map((size) => `
    <tr>
      <td>${size}</td>
      <td>
        <input
          type="number"
          min="0"
          step="1"
          class="call-count"
          data-size="${size}"
          value="0"
        >
      </td>
      <td class="call-percent" data-percent-size="${size}">0.00%</td>
    </tr>
  `).join("");

  document.querySelectorAll(".call-count").forEach((input) => {
    input.addEventListener("input", updateFormSummary);
  });

  updateFormSummary();
}

function getFormCounts() {
  const counts = {};

  document.querySelectorAll(".call-count").forEach((input) => {
    counts[input.dataset.size] = Math.max(0, Number(input.value) || 0);
  });

  return counts;
}

function updateFormSummary() {
  const counts = getFormCounts();
  const summary = groupCounts(counts);

  callSizes.forEach((size) => {
    const amount = Number(counts[size] || 0);
    const percentage = summary.total
      ? amount / summary.total * 100
      : 0;

    const cell = document.querySelector(
      `[data-percent-size="${CSS.escape(size)}"]`
    );

    if (cell) cell.textContent = percentage.toFixed(2) + "%";
  });

  $("totalCount").textContent = summary.total;
  $("ucCount").textContent =
    `${summary.uc} (${summary.ucPercent}%)`;
  $("goodCount").textContent =
    `${summary.good} (${summary.goodPercent}%)`;
  $("ocCount").textContent =
    `${summary.oc} (${summary.ocPercent}%)`;
}

function resetForm() {
  editing = null;
  $("calibrationForm").reset();

  document.querySelectorAll(".call-count").forEach((input) => {
    input.value = 0;
  });

  $("formTitle").textContent = "Tambah Data Kalibrasi";
  $("saveCalibration").textContent = "Simpan Data";
  updateFormSummary();
}


function openForm(type, row = null) {
  if (!isPetugas) {
    alert("Silakan login sebagai petugas terlebih dahulu.");
    return;
  }

  resetForm();

  $("formType").value = type;

  if (type === "ph") {
    $("phField").classList.remove("hidden");
  } else {
    $("phField").classList.add("hidden");
  }

  if (row) {
    $("weekInput").value = row.week;

    if (type === "ph") {
      $("phInput").value = row.ph || "";
    }

    document.querySelectorAll(".call-count").forEach((input) => {
      input.value = row.call_counts?.[input.dataset.size] || 0;
    });

    editing = { type, id: row.id };

    $("formTitle").textContent = "Edit Data Kalibrasi";
    $("saveCalibration").textContent = "Simpan Perubahan";
  } else {
    editing = { type, id: null };

    if (type === "ph") {
      $("phInput").value = $("phFilter").value;
    }
  }

  $("calibrationForm").classList.remove("hidden");

  updateFormSummary();

  $("calibrationForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function closeForm() {
  $("calibrationForm").classList.add("hidden");
  resetForm();
}

async function loadRecords() {
  try {
    const [pgResult, phResult] = await Promise.all([
      supabaseClient
        .from("calibration_pg")
        .select("*")
        .eq("pg", currentPG)
        .order("week", { ascending: false }),

      supabaseClient
        .from("calibration_ph")
        .select("*")
        .eq("pg", currentPG)
        .order("week", { ascending: false })
    ]);

    if (pgResult.error) throw pgResult.error;
    if (phResult.error) throw phResult.error;

    pgRecords = pgResult.data || [];
    phRecords = phResult.data || [];

    renderPGTable();
    renderPHOptions();
    renderPHTable();
    renderCharts();

  } catch (error) {
    console.error(error);
    alert("Data gagal dimuat. Periksa koneksi Supabase.");
  }
}

function renderPGTable() {
  $("pgTableBody").innerHTML = pgRecords.length
    ? pgRecords.map((row) => `
      <tr>
        <td>${row.week}</td>
        <td>${row.total_count}</td>
        <td>${row.uc_percent}%</td>
        <td>${row.good_call_percent}%</td>
        <td>${row.oc_percent}%</td>
        <td class="petugas-only ${isPetugas ? "" : "hidden"}">
          <button class="edit-button" data-edit-pg="${row.id}">
            Edit
          </button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="6" class="table-empty">Belum ada data kalibrasi PG.</td></tr>`;

  $("pgTableBody").querySelectorAll("[data-edit-pg]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = pgRecords.find(
        (item) => item.id === Number(button.dataset.editPg)
      );
      if (row) openForm("pg", row);
    });
  });
}

function renderPHOptions() {
  const previous = $("phFilter").value;

  const options = [...new Set(
    phRecords.map((row) => row.ph)
  )].sort((a, b) => a.localeCompare(b, "id", {
    numeric: true
  }));

  $("phFilter").innerHTML =
    `<option value="">Pilih PH</option>` +
    options.map((ph) =>
      `<option value="${ph}">${ph}</option>`
    ).join("");

  if (options.includes(previous)) {
    $("phFilter").value = previous;
  }
}

function renderPHTable() {
  const selectedPH = $("phFilter").value;

  const rows = phRecords.filter((row) =>
    !selectedPH || row.ph === selectedPH
  );

  $("phTableBody").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.ph}</td>
        <td>${row.week}</td>
        <td>${row.total_count}</td>
        <td>${row.uc_percent}%</td>
        <td>${row.good_call_percent}%</td>
        <td>${row.oc_percent}%</td>
        <td class="petugas-only ${isPetugas ? "" : "hidden"}">
          <button class="edit-button" data-edit-ph="${row.id}">
            Edit
          </button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="7" class="table-empty">Belum ada data PH.</td></tr>`;

  $("phTableBody").querySelectorAll("[data-edit-ph]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = phRecords.find(
        (item) => item.id === Number(button.dataset.editPh)
      );
      if (row) openForm("ph", row);
    });
  });
}

function aggregate(rows) {
  const total = rows.reduce((s, r) => s + Number(r.total_count || 0), 0);
  const uc = rows.reduce((s, r) => s + Number(r.uc_count || 0), 0);
  const oc = rows.reduce((s, r) => s + Number(r.oc_count || 0), 0);

  return {
    uc: total ? uc / total * 100 : 0,
    oc: total ? oc / total * 100 : 0
  };
}

function makeBarChart(canvasId, labels, values) {
  const canvas = $(canvasId);
  if (!canvas) return null;

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "UC",
          data: values.map((v) => v.uc),
          backgroundColor: "#267347",
          borderRadius: 5
        },
        {
          label: "OC",
          data: values.map((v) => v.oc),
          backgroundColor: "#9ac9a9",
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => value + "%"
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderCharts() {
  calibrationChart?.destroy();
  phChart?.destroy();

  const weekRows = [...pgRecords].sort(
    (a, b) => a.week - b.week
  );

  calibrationChart = makeBarChart(
    "pgCalibrationChart",
    weekRows.map((row) => "Week " + row.week),
    weekRows.map((row) => ({
      uc: Number(row.uc_percent),
      oc: Number(row.oc_percent)
    }))
  );

  const selectedPH = $("phFilter").value;
  const rows = phRecords
    .filter((row) => !selectedPH || row.ph === selectedPH)
    .sort((a, b) => a.week - b.week);

  phChart = makeBarChart(
    "phCalibrationChart",
    rows.map((row) => "Week " + row.week),
    rows.map((row) => ({
      uc: Number(row.uc_percent),
      oc: Number(row.oc_percent)
    }))
  );
}

async function saveCalibration(event) {
  event.preventDefault();

  if (!isPetugas) {
    alert("Akses petugas diperlukan.");
    return;
  }

  const type = editing?.type || $("formType").value;
  const counts = getFormCounts();
  const result = groupCounts(counts);

  if (!result.total) {
    alert("Masukkan jumlah Call terlebih dahulu.");
    return;
  }

  const payload = {
    pg: currentPG,
    week: Number($("weekInput").value),
    call_counts: counts,
    total_count: result.total,
    uc_count: result.uc,
    good_call_count: result.good,
    oc_count: result.oc,
    uc_percent: result.ucPercent,
    good_call_percent: result.goodPercent,
    oc_percent: result.ocPercent
  };

  if (!payload.week || payload.week < 1 || payload.week > 53) {
    alert("Masukkan Week antara 1 sampai 53.");
    return;
  }

  if (type === "ph") {
    payload.ph = $("phInput").value.trim();

    if (!payload.ph) {
      alert("Masukkan nama atau nomor PH.");
      return;
    }
  }

  const table = type === "ph"
    ? "calibration_ph"
    : "calibration_pg";

  try {
    let request = supabaseClient.from(table);

    if (editing?.id) {
      request = request
        .update(payload)
        .eq("id", editing.id);
    } else {
      request = request.insert([payload]);
    }

    const { error } = await request;

    if (error) throw error;

    closeForm();
    await loadRecords();
    alert("Data berhasil disimpan.");

  } catch (error) {
    console.error(error);
    alert("Data gagal disimpan: " + error.message);
  }
}

// TOMBOL DAN FORM
$("addPGButton")?.addEventListener("click", () => {
  $("formType").value = "pg";
  $("phField").classList.add("hidden");
  openForm("pg");
});

$("addPHButton")?.addEventListener("click", () => {
  $("formType").value = "ph";
  $("phField").classList.remove("hidden");
  openForm("ph");
});

$("cancelCalibration")?.addEventListener("click", closeForm);
$("calibrationForm")?.addEventListener("submit", saveCalibration);

$("phFilter")?.addEventListener("change", () => {
  renderPHTable();
  renderCharts();
});

makeFormRows();
loadRecords();
