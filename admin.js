const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const center = canvas.width / 2;

let angle = 0;
let peserta = [];
let hadir = [];
let tidakHadir = [];

let currentStar = null;
let currentWinner = null;
let timerInterval;
let timeLeft = 10;

/* ================= STORAGE ================= */

function getData(key) {
  const raw = JSON.parse(localStorage.getItem(key)) || [];

  // 🧹 FILTER DATA RUSAK
  return raw.filter(item => {
    if (typeof item === "string") {
      return item.trim() !== "";
    }
    if (typeof item === "object") {
      return item && item.nama;
    }
    return false;
  });
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ================= INIT ================= */

function initData() {
  peserta = getData("peserta");
  hadir = getData("hadir");
  tidakHadir = getData("tidakHadir");

  saveData("peserta", peserta);
  saveData("hadir", hadir);
  saveData("tidakHadir", tidakHadir);
}

initData();

/* ================= WHEEL ================= */

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (peserta.length === 0) {
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "18px Arial";
    ctx.fillText("Peserta habis", center, center);
    return;
  }

  const slice = (2 * Math.PI) / peserta.length;

  peserta.forEach((nama, i) => {
    const start = angle + i * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, center, start, end);
    ctx.fillStyle = `hsl(${(i * 360) / peserta.length},80%,55%)`;
    ctx.fill();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.fillStyle = "#000";
    ctx.textAlign = "right";
    ctx.font = "bold 14px Arial";
    ctx.fillText(nama, center - 15, 5);
    ctx.restore();
  });
}

function spinWheel() {
  peserta = getData("peserta");

  if (!peserta.length) {
    alert("Peserta habis!");
    return;
  }

  const duration = 4000;
  const startAngle = angle;
  const spin = Math.random() * 8 * Math.PI + 6 * Math.PI;
  let startTime = null;

  function animate(t) {
    if (!startTime) startTime = t;
    const progress = Math.min((t - startTime) / duration, 1);

    angle = startAngle + spin * (1 - Math.pow(1 - progress, 3));
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      pickWinner();
    }
  }

  requestAnimationFrame(animate);
}

/* ================= PICK WINNER ================= */

function pickWinner() {
  const slice = (2 * Math.PI) / peserta.length;
  const pointer = (3 * Math.PI) / 2;

  let adj = (pointer - angle) % (2 * Math.PI);
  if (adj < 0) adj += 2 * Math.PI;

  const index = Math.floor(adj / slice);
  const winner = peserta[index];

  // 🚨 SAFETY CHECK
  if (!winner) {
    alert("Data peserta bermasalah. Refresh admin.");
    return;
  }

  currentWinner = winner;
  currentStar = getRandomStar();

  peserta.splice(index, 1);
  saveData("peserta", peserta);

  showModal();
  drawWheel();
}

/* ================= MODAL ================= */

function showModal() {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modalNama").innerText = currentWinner;
  document.getElementById("modalStar").innerText =
    `Bintang: ⭐ ${currentStar}`;

  timeLeft = 15;
  document.getElementById("timer").innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      setTidakHadir();
    }
  }, 1000);
}

function closeModal() {
  clearInterval(timerInterval);
  document.getElementById("modal").style.display = "none";
  updateLists();
}

/* ================= ACTION ================= */

function setHadir() {
  if (!currentWinner) return;

  hadir.push({
    nama: currentWinner,
    status: "Hadir",
    bintang: currentStar
  });

  saveData("hadir", hadir);
  closeModal();
}

function setTidakHadir() {
  if (!currentWinner) return;

  tidakHadir.push({
    nama: currentWinner,
    status: "Tidak Hadir",
    bintang: "-"
  });

  saveData("tidakHadir", tidakHadir);
  closeModal();
}

/* ================= LIST ================= */

function updateLists() {
  hadir = getData("hadir");
  tidakHadir = getData("tidakHadir");

  document.getElementById("hadirList").innerHTML =
    hadir.map(p => `<li>${p.nama} ⭐ ${p.bintang}</li>`).join("");

  document.getElementById("tidakHadirList").innerHTML =
    tidakHadir.map(p => `<li>${p.nama}</li>`).join("");
}

updateLists();
drawWheel();

/* ================= EXPORT CSV ================= */

function getTanggalHariIni() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
}

function exportData() {
  const hadir = getData("hadir");
  const tidakHadir = getData("tidakHadir");

  if (!hadir.length && !tidakHadir.length) {
    alert("Belum ada data untuk diexport!");
    return;
  }

  const tanggal = getTanggalHariIni();

  let csv = "";
  csv += "PEMENANG BINTANG,,,\n";
  csv += `${tanggal},,,\n\n`;
  csv += "Nomor,Nama,Status,Jenis Bintang\n";

  let no = 1;

  hadir.forEach(p => {
    csv += `${no},${p.nama},Hadir,${p.bintang}\n`;
    no++;
  });

  tidakHadir.forEach(p => {
    csv += `${no},${p.nama},Tidak Hadir,-\n`;
    no++;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Live Spin Bintang (${tanggal}).csv`;
  link.click();

  localStorage.setItem("csvDownloaded", "true");
}

/* ================= RESET ================= */

function resetAll() {
  if (localStorage.getItem("csvDownloaded") !== "true") {
    alert("⚠️ Download hasil terlebih dahulu sebelum reset!");
    return;
  }

  if (!confirm("Yakin ingin reset semua data undian?")) return;

  localStorage.clear();
  location.reload();
}

/* ================= BINTANG ================= */

function getRandomStar() {
  return Math.random() < 0.7 ? 1 : 10;
}

/* ================= LOGOUT ================= */

function logoutAdmin() {
  if (!confirm("Akhiri sesi admin?")) return;

  localStorage.removeItem("adminLock");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("adminSession");

  window.location.href = "index.html";
}
