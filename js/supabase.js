
/* =====================================
   QC PACKING HOUSE - SUPABASE
===================================== */

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/*
  Nama tabel yang digunakan:

  calibration_pg
  calibration_ph

  Kedua tabel akan menyimpan data
  kalibrasi secara terpisah.
*/

// =====================================
// MEMBACA DATA KALIBRASI PG
// =====================================

async function getCalibrationPG(pg) {
  const { data, error } = await supabaseClient
    .from("calibration_pg")
    .select("*")
    .eq("pg", pg)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data PG:", error);
    throw error;
  }

  return data || [];
}

// =====================================
// MEMBACA DATA KALIBRASI PH
// =====================================

async function getCalibrationPH(pg, ph) {
  const { data, error } = await supabaseClient
    .from("calibration_ph")
    .select("*")
    .eq("pg", pg)
    .eq("ph", ph)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data PH:", error);
    throw error;
  }

  return data || [];
}

// =====================================
// MENAMBAHKAN DATA PG
// =====================================

async function addCalibrationPG(payload) {
  const { data, error } = await supabaseClient
    .from("calibration_pg")
    .insert([payload])
    .select();

  if (error) {
    console.error("Gagal menyimpan data PG:", error);
    throw error;
  }

  return data;
}

// =====================================
// MENAMBAHKAN DATA PH
// =====================================

async function addCalibrationPH(payload) {
  const { data, error } = await supabaseClient
    .from("calibration_ph")
    .insert([payload])
    .select();

  if (error) {
    console.error("Gagal menyimpan data PH:", error);
    throw error;
  }

  return data;
}

// =====================================
// MENGEDIT DATA PG
// =====================================

async function updateCalibrationPG(id, payload) {
  const { data, error } = await supabaseClient
    .from("calibration_pg")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Gagal mengedit data PG:", error);
    throw error;
  }

  return data;
}

// =====================================
// MENGEDIT DATA PH
// =====================================

async function updateCalibrationPH(id, payload) {
  const { data, error } = await supabaseClient
    .from("calibration_ph")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Gagal mengedit data PH:", error);
    throw error;
  }

  return data;
}

// =====================================
// MENGHAPUS DATA PG
// =====================================

async function deleteCalibrationPG(id) {
  const { error } = await supabaseClient
    .from("calibration_pg")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Gagal menghapus data PG:", error);
    throw error;
  }
}

// =====================================
// MENGHAPUS DATA PH
// =====================================

async function deleteCalibrationPH(id) {
  const { error } = await supabaseClient
    .from("calibration_ph")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Gagal menghapus data PH:", error);
    throw error;
  }
}
