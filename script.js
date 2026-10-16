
/* =====================================
   ZORA PERSONAL FINANCE
   ===================================== */

// Data transaksi yang sedang digunakan
let transaksi = [];

// Kunci penyimpanan baru, tanpa sistem akun
const KUNCI_TRANSAKSI = "zoraTransaksi";


/* =====================================
   FORMAT RUPIAH DAN TANGGAL
   ===================================== */


function formatInputRupiah(input) {
    input.addEventListener("input", function () {
        // Ambil angka saja
        let angka = this.value.replace(/\D/g, "");

        // Tambahkan titik setiap 3 digit
        this.value = angka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });
}

// Aktifkan format otomatis
document.addEventListener("DOMContentLoaded", function () {
    const inputPemasukan = document.getElementById("jumlah");
    const inputPengeluaran = document.getElementById("jumlahPengeluaran");

    if (inputPemasukan) {
        formatInputRupiah(inputPemasukan);
    }

    if (inputPengeluaran) {
        formatInputRupiah(inputPengeluaran);
    }
})



function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(angka);
}

function formatTanggal(tanggal) {
    const tanggalObj = new Date(tanggal + "T00:00:00");

    return tanggalObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatBulan(bulan) {
    const tanggal = new Date(bulan + "-01T00:00:00");

    return tanggal.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
    });
}

function tanggalHariIni() {
    const sekarang = new Date();

    return (
        sekarang.getFullYear() + "-" +
        String(sekarang.getMonth() + 1).padStart(2, "0") + "-" +
        String(sekarang.getDate()).padStart(2, "0")
    );
}


/* =====================================
   NAVIGASI HALAMAN
   ===================================== */

function bukaMenu(menu) {
    // Sembunyikan seluruh halaman
    document.querySelectorAll(".halaman").forEach(function(halaman) {
        halaman.classList.remove("aktif");
    });

    // Hilangkan status aktif seluruh tombol
    document.querySelectorAll(".menu-btn").forEach(function(tombol) {
        tombol.classList.remove("aktif");
    });

    // Tampilkan halaman yang dipilih
    const halamanDipilih = document.getElementById("menu-" + menu);

    if (!halamanDipilih) {
        return;
    }

    halamanDipilih.classList.add("aktif");

    // Tandai tombol yang dipilih
    document.querySelectorAll(".menu-btn").forEach(function(tombol) {
        if (tombol.getAttribute("onclick") === "bukaMenu('" + menu + "')") {
            tombol.classList.add("aktif");
        }
    });
}


/* =====================================
   PENYIMPANAN TRANSAKSI
   ===================================== */

function muatTransaksi() {
    const dataTersimpan = localStorage.getItem(KUNCI_TRANSAKSI);

    if (dataTersimpan !== null) {
        try {
            const data = JSON.parse(dataTersimpan);

            transaksi = Array.isArray(data) ? data : [];
        } catch (error) {
            transaksi = [];
            console.error("Data transaksi tidak dapat dibaca:", error);
        }
    } else {
        // Coba mengambil transaksi akun lama yang sedang aktif.
        // Data akun lama tidak dihapus.
        try {
            const dataAkun = JSON.parse(
                localStorage.getItem("akunZora") || "[]"
            );

            const daftarAkun = Array.isArray(dataAkun)
                ? dataAkun
                : [dataAkun];

            const usernameAktif = localStorage.getItem("akunAktif");

            const akunLama = daftarAkun.find(function(akun) {
                return akun.username === usernameAktif;
            });

            if (akunLama && Array.isArray(akunLama.transaksi)) {
                transaksi = akunLama.transaksi;
            }
        } catch (error) {
            console.error("Data lama tidak dapat dibaca:", error);
        }
    }

    simpanTransaksi();
    updateSaldo();
    buatFilterBulan();
    tampilkanTransaksi();
    tampilkanGrafik();
}

function simpanTransaksi() {
    localStorage.setItem(
        KUNCI_TRANSAKSI,
        JSON.stringify(transaksi)
    );
}


/* =====================================
   MENAMBAHKAN TRANSAKSI
   ===================================== */

function tambahTransaksi(jenis) {
    let nama;
    let jumlah;
    let kategori;

    if (jenis === "pemasukan") {
        nama = document.getElementById("namaTransaksi").value.trim();
        jumlah = Number(
            document.getElementById("jumlah").value.replace(/\./g, "")
        );
        kategori = document.getElementById("kategori").value;
    } else if (jenis === "pengeluaran") {
        nama = document.getElementById("namaPengeluaran").value.trim();
        jumlah = Number(
            document.getElementById("jumlahPengeluaran").value.replace(/\./g, "")
        );
        kategori = document.getElementById("kategoriPengeluaran").value;
    } else {
        return;
    }

    if (jenis === "pemasukan") {
        const namaOtomatis = {
            "gaji": "Gaji",
            "uang-saku": "Uang Saku",
            "tabungan": "Tabungan"
        };

        if (namaOtomatis[kategori]) {
            nama = namaOtomatis[kategori];
        }
    }

    if (nama === "" || !Number.isFinite(jumlah) || jumlah <= 0) {
        alert("Isi nama transaksi dan jumlah uang dengan benar!");
        return;
    }

    transaksi.push({
        nama: nama,
        jumlah: jumlah,
        jenis: jenis,
        kategori: kategori,
        tanggal: tanggalHariIni()
    });

    simpanTransaksi();
    updateSaldo();
    buatFilterBulan();
    tampilkanTransaksi();
    tampilkanGrafik();

    if (jenis === "pemasukan") {
        document.getElementById("namaTransaksi").value = "";
        document.getElementById("jumlah").value = "";
    } else {
        document.getElementById("namaPengeluaran").value = "";
        document.getElementById("jumlahPengeluaran").value = "";
    }

    alert("Transaksi berhasil disimpan!");
}


/* =====================================
   RINGKASAN SALDO
   ===================================== */

function updateSaldo() {
    let pemasukan = 0;
    let pengeluaran = 0;

    transaksi.forEach(function(item) {
        if (item.jenis === "pemasukan") {
            pemasukan += Number(item.jumlah);
        } else if (item.jenis === "pengeluaran") {
            pengeluaran += Number(item.jumlah);
        }
    });

    const saldo = pemasukan - pengeluaran;

    document.getElementById("saldo").textContent =
        formatRupiah(saldo);

    document.getElementById("pemasukan").textContent =
        formatRupiah(pemasukan);

    document.getElementById("pengeluaran").textContent =
        formatRupiah(pengeluaran);
}


/* =====================================
   IKON KATEGORI
   ===================================== */

function getIcon(kategori) {
    const icons = {
        "gaji": "💼",
        "uang-saku": "💰",
        "makanan": "🍔",
        "transportasi": "🚗",
        "belanja": "🛍️",
        "hiburan": "🎮",
        "pendidikan": "📚",
        "tabungan": "🏦",
        "lainnya": "📦"
    };

    return icons[kategori] || "📦";
}


/* =====================================
   RIWAYAT TRANSAKSI
   ===================================== */

function tampilkanTransaksi() {
    const daftar = document.getElementById("daftarTransaksi");
    const filter = document.getElementById("filterBulan");

    const bulanDipilih = filter ? filter.value : "semua";

    const daftarFilter = transaksi.filter(function(item) {
        if (bulanDipilih === "semua") {
            return true;
        }

        return item.tanggal &&
            item.tanggal.substring(0, 7) === bulanDipilih;
    });

    daftar.replaceChildren();

    if (daftarFilter.length === 0) {
        const pesan = document.createElement("p");

        pesan.textContent = transaksi.length === 0
            ? "Belum ada transaksi."
            : "Tidak ada transaksi pada bulan ini.";

        daftar.appendChild(pesan);
        return;
    }

    daftarFilter.slice().reverse().forEach(function(item) {
        const index = transaksi.indexOf(item);

        const baris = document.createElement("div");
        baris.classList.add("transaksi");

        const info = document.createElement("div");
        info.classList.add("transaksi-info");

        const ikon = document.createElement("div");
        ikon.classList.add("transaksi-icon");
        ikon.textContent = getIcon(item.kategori);

        const detail = document.createElement("div");

        const nama = document.createElement("h3");
        nama.textContent = item.nama;

        const tanggal = document.createElement("p");
        tanggal.textContent =
            item.jenis + " • " + formatTanggal(item.tanggal);

        detail.append(nama, tanggal);
        info.append(ikon, detail);

        const nominal = document.createElement("div");
        nominal.classList.add(
            "nominal",
            item.jenis === "pemasukan" ? "pemasukan" : "pengeluaran"
        );

        if (item.jenis === "pengeluaran") {
            nominal.classList.add("pengeluaran");
        }

        const tanda = item.jenis === "pemasukan" ? "+" : "-";

        nominal.textContent = tanda + " " + formatRupiah(item.jumlah);

        const tombolHapus = document.createElement("button");
        tombolHapus.classList.add("hapus-btn");
        tombolHapus.textContent = "🗑️";
        tombolHapus.onclick = function() {
            hapusTransaksi(index);
        };

        baris.append(info, nominal, tombolHapus);
        daftar.appendChild(baris);
    });
}


/* =====================================
   FILTER BULAN
   ===================================== */

function buatFilterBulan() {
    const filter = document.getElementById("filterBulan");

    const pilihanLama = filter.value;
    const daftarBulan = [
        ...new Set(
            transaksi
                .filter(function(item) {
                    return item.tanggal;
                })
                .map(function(item) {
                    return item.tanggal.substring(0, 7);
                })
        )
    ].sort().reverse();

    filter.replaceChildren();

    const semua = document.createElement("option");
    semua.value = "semua";
    semua.textContent = "Semua";
    filter.appendChild(semua);

    daftarBulan.forEach(function(bulan) {
        const option = document.createElement("option");

        option.value = bulan;
        option.textContent = formatBulan(bulan);

        filter.appendChild(option);
    });

    if (
        pilihanLama === "semua" ||
        daftarBulan.includes(pilihanLama)
    ) {
        filter.value = pilihanLama;
    } else {
        filter.value = "semua";
    }
}

function filterTransaksi() {
    tampilkanTransaksi();
}


/* =====================================
   MENGHAPUS TRANSAKSI
   ===================================== */

function hapusTransaksi(index) {
    if (index < 0 || index >= transaksi.length) {
        return;
    }

    transaksi.splice(index, 1);

    simpanTransaksi();
    updateSaldo();
    buatFilterBulan();
    tampilkanTransaksi();
    tampilkanGrafik();
}


/* =====================================
   GRAFIK KEUANGAN BULANAN
   ===================================== */

   function tampilkanGrafik() {
    const wadah = document.getElementById("grafikKeuangan");
    if (!wadah) return;

    const sekarang = new Date();
    const daftarBulan = [];

    // Ambil enam bulan terakhir
    for (let i = 5; i >= 0; i--) {
        const tanggal = new Date(
            sekarang.getFullYear(),
            sekarang.getMonth() - i,
            1
        );

        daftarBulan.push({
            kunci:
                tanggal.getFullYear() + "-" +
                String(tanggal.getMonth() + 1).padStart(2, "0"),
            nama: tanggal.toLocaleDateString("id-ID", {
                month: "short"
            }),
            pemasukan: 0,
            pengeluaran: 0
        });
    }

    // Kelompokkan transaksi berdasarkan bulan
    transaksi.forEach(item => {
        if (!item.tanggal) return;

        const bulan = daftarBulan.find(
            data => data.kunci === item.tanggal.substring(0, 7)
        );

        if (!bulan) return;

        const jumlah = Number(item.jumlah) || 0;

        if (item.jenis === "pemasukan") {
            bulan.pemasukan += jumlah;
        } else if (item.jenis === "pengeluaran") {
            bulan.pengeluaran += jumlah;
        }
    });

    const lebar = 600;
    const tinggi = 260;
    const kiri = 55;
    const kanan = 15;
    const atas = 25;
    const bawah = 38;
    const areaLebar = lebar - kiri - kanan;
    const areaTinggi = tinggi - atas - bawah;

    const nilaiMaksimum = Math.max(
        1,
        ...daftarBulan.map(b =>
            Math.max(b.pemasukan, b.pengeluaran)
        )
    );

    const langkahX = areaLebar / (daftarBulan.length - 1);

    const titik = (nilai, index) => ({
        x: kiri + index * langkahX,
        y: atas + areaTinggi -
            (nilai / nilaiMaksimum) * areaTinggi
    });

    const buatGaris = properti =>
        daftarBulan.map((bulan, index) => {
            const p = titik(bulan[properti], index);
            return `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`;
        }).join(" ");

    const garisMasuk = buatGaris("pemasukan");
    const garisKeluar = buatGaris("pengeluaran");

    const dasarY = atas + areaTinggi;

    const buatArea = garis =>
        `${garis} L ${kiri + areaLebar} ${dasarY} L ${kiri} ${dasarY} Z`;

    const formatRingkas = angka => {
        if (angka >= 1000000) {
            return "Rp" + (angka / 1000000)
                .toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
        }

        if (angka >= 1000) {
            return "Rp" + (angka / 1000)
                .toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " rb";
        }

        return "Rp" + angka.toLocaleString("id-ID");
    };

    const garisGrid = Array.from({ length: 5 }, (_, i) => {
        const y = atas + (areaTinggi / 4) * i;
        const nilai = nilaiMaksimum * (4 - i) / 4;

        return `
            <line x1="${kiri}" y1="${y}" x2="${lebar - kanan}"
                y2="${y}" class="grid-line" />
            <text x="${kiri - 8}" y="${y + 4}"
                text-anchor="end" class="axis-label">
                ${formatRingkas(nilai)}
            </text>
        `;
    }).join("");

    const labelBulan = daftarBulan.map((bulan, index) => {
        const x = kiri + index * langkahX;

        return `
            <text x="${x}" y="${tinggi - 10}"
                text-anchor="middle" class="axis-label">
                ${bulan.nama}
            </text>
        `;
    }).join("");

    const buatTitik = properti =>
        daftarBulan.map((bulan, index) => {
            const p = titik(bulan[properti], index);

            return `
                <circle cx="${p.x}" cy="${p.y}" r="4"
                    class="titik-${properti}">
                    <title>${bulan.nama}: ${formatRupiah(bulan[properti])}</title>
                </circle>
            `;
        }).join("");

    wadah.innerHTML = `
        <div class="grafik-ringkasan">
            <div class="legenda-item">
                <span class="legenda-dot dot-masuk"></span>
                <span>Pemasukan</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-dot dot-keluar"></span>
                <span>Pengeluaran</span>
            </div>
        </div>

        <div class="grafik-svg-wrapper">
            <svg class="neon-chart"
                viewBox="0 0 ${lebar} ${tinggi}"
                role="img"
                aria-label="Grafik pemasukan dan pengeluaran enam bulan terakhir">

                <defs>
                    <linearGradient id="areaMasuk"
                        x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00E5FF"
                            stop-opacity="0.30" />
                        <stop offset="100%" stop-color="#00E5FF"
                            stop-opacity="0.01" />
                    </linearGradient>

                    <linearGradient id="areaKeluar"
                        x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#A78BFA"
                            stop-opacity="0.25" />
                        <stop offset="100%" stop-color="#A78BFA"
                            stop-opacity="0.01" />
                    </linearGradient>

                    <filter id="glowCyan" x="-50%" y="-50%"
                        width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3"
                            result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="glowPurple" x="-50%" y="-50%"
                        width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3"
                            result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                ${garisGrid}

                <path d="${buatArea(garisKeluar)}"
                    fill="url(#areaKeluar)" />

                <path d="${buatArea(garisMasuk)}"
                    fill="url(#areaMasuk)" />

                <path d="${garisKeluar}"
                    class="garis-chart garis-keluar"
                    filter="url(#glowPurple)" />

                <path d="${garisMasuk}"
                    class="garis-chart garis-masuk"
                    filter="url(#glowCyan)" />

                ${buatTitik("pengeluaran")}
                ${buatTitik("pemasukan")}
                ${labelBulan}
            </svg>
        </div>

        <p class="grafik-keterangan">
            <span></span> Data enam bulan terakhir
        </p>
    `;
}


/* =====================================
   MULAI ZORA
   ===================================== */

document.addEventListener("DOMContentLoaded", function() {
    muatTransaksi();
    bukaMenu("beranda");

    // Pilihan kategori awal
    const kategori = document.getElementById("kategori");

    if (kategori) {
        kategori.addEventListener("change", cekKategori);
        cekKategori();
    }
});


/* =====================================
   PENGATURAN KATEGORI
   ===================================== */

function cekKategori() {
    // Nama untuk kategori gaji, uang saku, dan tabungan
    // akan ditentukan otomatis ketika transaksi disimpan.
}
