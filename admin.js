const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const center = canvas.width / 2;

let angle = 0;
let peserta = getData("peserta");
let hadir = getData("hadir");
let tidakHadir = getData("tidakHadir");

let currentStar = null;
let currentWinner = null;
let timerInterval;
let timeLeft = 10;

// ---------- STORAGE ----------
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------- WHEEL ----------
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
    ctx.fillStyle = `hsl(${i * 360 / peserta.length},80%,55%)`;
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
  if (peserta.length === 0) return alert("Peserta habis!");

  const duration = 4000;
  const startAngle = angle;
  const spin = Math.random() * 8 * Math.PI + 6 * Math.PI;
  let startTime = null;

  function animate(t) {
    if (!startTime) startTime = t;
    const progress = Math.min((t - startTime) / duration, 1);
    angle = startAngle + spin * (1 - Math.pow(1 - progress, 3));
    drawWheel();

    if (progress < 1) requestAnimationFrame(animate);
    else pickWinner();
  }
  requestAnimationFrame(animate);
}

// ---------- PICK WINNER ----------
function pickWinner() {
  const slice = (2 * Math.PI) / peserta.length;
  const pointer = (3 * Math.PI) / 2;

  let adj = (pointer - angle) % (2 * Math.PI);
  if (adj < 0) adj += 2 * Math.PI;

  const index = Math.floor(adj / slice);
  currentWinner = peserta[index];

  currentStar = getRandomStar();

  peserta.splice(index, 1);
  saveData("peserta", peserta);

  showModal();
  drawWheel();
}

// ---------- MODAL ----------
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

// ---------- ACTION ----------
function setHadir() {
  hadir.push({
    nama: currentWinner,
    status: "Hadir",
    bintang: currentStar
  });
  saveData("hadir", hadir);
  closeModal();
}

function setTidakHadir() {
  tidakHadir.push({
    nama: currentWinner,
    status: "Tidak Hadir",
    bintang: "-"
  });
  saveData("tidakHadir", tidakHadir);
  closeModal();
}


// ---------- LIST ----------
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

// ---------- file csv ----------
function getTanggalHariIni() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
function exportData() {
  const hadirRaw = JSON.parse(localStorage.getItem("hadir")) || [];
  const tidakHadirRaw = JSON.parse(localStorage.getItem("tidakHadir")) || [];

  // 🔒 FILTER DATA NULL / RUSAK
  const hadir = hadirRaw.filter(p => p && p.nama);
  const tidakHadir = tidakHadirRaw.filter(p => p && p.nama);

  if (hadir.length === 0 && tidakHadir.length === 0) {
    alert("Belum ada data untuk diexport!");
    return;
  }

  const tanggal = getTanggalHariIni();

  let csv = "";
  csv += "PEMENANG BINTANG,,,\n";
  csv += `${tanggal},,,\n\n`;
  csv += "Nomor,Nama,Status,Jenis Bintang\n";

  let nomor = 1;

  hadir.forEach(p => {
    csv += `${nomor},${p.nama},Hadir,${p.bintang}\n`;
    nomor++;
  });

  tidakHadir.forEach(p => {
    csv += `${nomor},${p.nama},Tidak Hadir,-\n`;
    nomor++;
  });

  const filename = `Live Spin Bintang (${tanggal}).csv`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  localStorage.setItem("csvDownloaded", "true");
}

// ---------- kode reset ----------
function resetAll() {
  const downloaded = localStorage.getItem("csvDownloaded");

  if (downloaded !== "true") {
    alert("⚠️ Harap download hasil undian terlebih dahulu sebelum reset!");
    return;
  }

  if (!confirm("Yakin ingin reset semua data undian?")) return;

  localStorage.clear();
  location.reload();
}

// ---------- bintang ----------
function getRandomStar() {
  return Math.random() < 0.7 ? 1 : 10;
}
