function shareWA() {
  const teks = "Saya ikut undian mendapatkan bintang di akun facebook @Yana Yusuf🎉";

  navigator.clipboard.writeText(teks).then(() => {
    // tandai sudah buka WA
    localStorage.setItem("sudahWA", "true");

    // buka WhatsApp
    window.open("https://wa.me/", "_blank");

    // aktifkan tombol submit
    document.getElementById("submitBtn").disabled = false;

    document.getElementById("status").innerText =
      "Teks berhasil disalin📋 \n ajak temanmu untuk ikutan ✅";
  }).catch(() => {
    alert("Gagal menyalin teks. Coba browser lain.");
  });
}
function submitNama() {
  const namaInput = document.getElementById("nama");
  const nama = namaInput.value.trim();

  if (nama === "") {
    alert("Nama tidak boleh kosong!");
    return;
  }

  // cek apakah sudah klik WA
  if (localStorage.getItem("sudahWA") !== "true") {
    alert("Silakan klik tombol WhatsApp dulu 📲");
    return;
  }

  let peserta = JSON.parse(localStorage.getItem("peserta")) || [];

  if (peserta.includes(nama)) {
    alert("Nama sudah terdaftar!");
    return;
  }

  peserta.push(nama);
  localStorage.setItem("peserta", JSON.stringify(peserta));

  document.getElementById("status").innerText =
    `${nama} berhasil didaftarkan ✅\nTunggu di live ya, semoga beruntung!`;

  // reset
  namaInput.value = "";
  localStorage.removeItem("sudahWA");
  document.getElementById("submitBtn").disabled = true;
}
