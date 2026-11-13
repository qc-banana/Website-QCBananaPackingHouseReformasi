
// =========================================
// DASHBOARD QC PACKING HOUSE
// Menampilkan data WEEK TERBARU
// =========================================

let pgSummaryChart = null;
let phSummaryChart = null;

// Daftar PH berdasarkan PG
const phByPG = {
  "PG 1": ["PH 14", "PH 12"],
  "PG 2": ["PH 40", "PH 307"],
  "PG 3": ["PH 520", "PH 529", "PH 533", "PH 549"],
  "PG 4": ["PH 411", "PH 415"]
};

// Urutan PG
const pgLabels = ["PG 1", "PG 2", "PG 3", "PG 4"];

// =========================================
// MENGHITUNG PERSENTASE
// =========================================

function calculateSummary(rows) {
  const total = rows.reduce(
    (sum, row) => sum + Number(row.total_count || 0), 0
  );

  const uc = rows.reduce(
    (sum, row) => sum + Number(row.uc_count || 0), 0
  );

  const oc = rows.reduce(
    (sum, row) => sum + Number(row.oc_count || 0), 0
  );

  return {
    uc: total ? +(uc / total * 100).toFixed(2) : 0,
    oc: total ? +(oc / total * 100).toFixed(2) : 0
  };
}

// =========================================
// MENCARI WEEK TERBARU
// =========================================

function getLatestWeek(rows) {
  if (!rows.length) return null;

  return Math.max(
    ...rows.map(row => Number(row.week) || 0)
  );
}

// =========================================
// MEMBUAT GRAFIK
// =========================================

function createSummaryChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);

  if (!canvas) return null;

  return new Chart(canvas, {
    type: "bar",

    data: {
      labels: labels,

      datasets: [
        {
          label: "UC",
          data: values.map(item => item.uc),
          backgroundColor: "#267347",
          borderRadius: 5,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        },
        {
          label: "OC",
          data: values.map(item => item.oc),
          backgroundColor: "#9ac9a9",
          borderRadius: 5,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label: context =>
              `${context.dataset.label}: ${context.raw}%`
          }
        }
      },

      scales: {
        y: {
          beginAtZero: true,
          max: 100,

          ticks: {
            callback: value => value + "%"
          },

          grid: {
            color: "#edf1ee"
          }
        },

        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// =========================================
// MEMUAT GRAFIK DASHBOARD
// =========================================

async function loadDashboardCharts() {
  try {

    const [pgResult, phResult] = await Promise.all([

      supabaseClient
        .from("calibration_pg")
        .select("*"),

      supabaseClient
        .from("calibration_ph")
        .select("*")

    ]);

    if (pgResult.error) throw pgResult.error;
    if (phResult.error) throw phResult.error;

    const allPG = pgResult.data || [];
    const allPH = phResult.data || [];

    // =====================================
    // GRAFIK Callibrasi PG
    // =====================================

    const latestPGWeek = getLatestWeek(allPG);

    document.getElementById("pgLatestWeek").textContent =
    latestPGWeek !== null
    ? `Week ${latestPGWeek}`
    : "Belum ada data";

    const latestPGRows = latestPGWeek === null
      ? []
      : allPG.filter(row =>
          Number(row.week) === latestPGWeek
        );

    const pgValues = pgLabels.map(pg => {

      const rows = latestPGRows.filter(
        row => row.pg === pg
      );

      return calculateSummary(rows);

    });

    pgSummaryChart?.destroy();

    pgSummaryChart = createSummaryChart(
      "pgSummaryChart",
      pgLabels,
      pgValues
    );

    // =====================================
    // GRAFIK Callibrasi PH
    // =====================================

    const phLabels = [];
    const phValues = [];

    const latestPHWeek = getLatestWeek(allPH);

    document.getElementById("phLatestWeek").textContent =
      latestPHWeek !== null
        ? `Week terbaru: ${latestPHWeek}`
        : "Week terbaru: -";

    pgLabels.forEach(pg => {

      const latestWeek = latestPHWeek;

      if (latestWeek === null) return;

      const latestRows = allPH.filter(row =>
        row.pg === pg &&
        Number(row.week) === latestWeek
      );

      phByPG[pg].forEach(ph => {

        const rows = latestRows.filter(row =>
          String(row.ph).trim() === ph
        );

        // Tampilkan PH yang sudah memiliki data
        if (!rows.length) return;

        phLabels.push(ph);

        phValues.push(
          calculateSummary(rows)
        );

      });

    });

    phSummaryChart?.destroy();

    phSummaryChart = createSummaryChart(
      "phSummaryChart",
      phLabels,
      phValues
    );

    console.log("Dashboard berhasil dimuat.");
    console.log("Week terbaru PG:", latestPGWeek);

    pgLabels.forEach(pg => {
      console.log(
        pg,
        "Week PH:",
        getLatestWeek(allPH.filter(row => row.pg === pg))
      );
    });

  } catch (error) {

    console.error(
      "Dashboard gagal dimuat:",
      error
    );

  }
}

// =========================================
// JALANKAN DASHBOARD
// =========================================

loadDashboardCharts();
