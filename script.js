
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

    // Format nominal target tabungan
    const inputNominalTarget = document.getElementById("nominalTarget");
    const inputTabunganAwal = document.getElementById("tabunganAwal");
    const inputNominalManual = document.getElementById("nominalManual");
    const inputJumlahAlokasi = document.getElementById("jumlahAlokasi");

    [
        inputNominalTarget,
        inputTabunganAwal,
        inputNominalManual,
        inputJumlahAlokasi
    ].forEach(function(input) {
        if (input) {
            formatInputRupiah(input);
        }
    });
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

    // Perbarui statistik ketika halaman dibuka
    if (menu === "statistik") {
        tampilkanStatistik();
    }
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
    let targetDipilih = null;
    let nominalAlokasi = 0;

    if (jenis === "pemasukan") {
        const inputKategori = document.getElementById("kategori");
        const inputJumlah = document.getElementById("jumlah");
        const inputNama = document.getElementById("namaTransaksi");

        if (!inputKategori || !inputJumlah) {
            console.error("Elemen form pemasukan tidak ditemukan.");
            alert("Form pemasukan bermasalah. Periksa index.html.");
            return;
        }

        kategori = inputKategori.value;
        jumlah = Number(inputJumlah.value.replace(/\./g, ""));

        const namaOtomatis = {
            "gaji": "Gaji",
            "uang-saku": "Uang Saku",
            "tabungan": "Tabungan"
        };

        if (kategori === "lainnya") {
            nama = inputNama ? inputNama.value.trim() : "";
        } else {
            nama = namaOtomatis[kategori] || "";
        }

        // Ambil target dan nominal alokasi tabungan
        const pilihanTarget = document.getElementById("targetAlokasi");
        const inputAlokasi = document.getElementById("jumlahAlokasi");

        if (pilihanTarget && pilihanTarget.value && inputAlokasi) {
            nominalAlokasi = Number(
                inputAlokasi.value.replace(/\./g, "")
            );

            targetDipilih = targetTabungan.find(
                target => String(target.id) === pilihanTarget.value
            );

            if (!targetDipilih) {
                alert("Target tabungan tidak ditemukan.");
                return;
            }

            if (
                !Number.isSafeInteger(nominalAlokasi) ||
                nominalAlokasi <= 0
            ) {
                alert("Masukkan nominal alokasi tabungan yang valid.");
                return;
            }

            if (nominalAlokasi > jumlah) {
                alert("Alokasi tabungan tidak boleh melebihi pemasukan.");
                return;
            }

            const terkumpul = Number(targetDipilih.terkumpul) || 0;

            if (terkumpul + nominalAlokasi > Number(targetDipilih.nominal)) {
                alert("Alokasi melebihi sisa target tabungan.");
                return;
            }
        }

    } else if (jenis === "pengeluaran") {
        const inputNama = document.getElementById("namaPengeluaran");
        const inputJumlah = document.getElementById("jumlahPengeluaran");
        const inputKategori = document.getElementById("kategoriPengeluaran");

        if (!inputNama || !inputJumlah || !inputKategori) {
            console.error("Elemen form pengeluaran tidak ditemukan.");
            alert("Form pengeluaran bermasalah. Periksa index.html.");
            return;
        }

        nama = inputNama.value.trim();
        jumlah = Number(inputJumlah.value.replace(/\./g, ""));
        kategori = inputKategori.value;

    } else {
        return;
    }

    if (!nama) {
        alert("Masukkan nama transaksi terlebih dahulu.");
        return;
    }

    if (!Number.isSafeInteger(jumlah) || jumlah <= 0) {
        alert("Masukkan nominal transaksi yang valid.");
        return;
    }

    // Simpan transaksi pemasukan atau pengeluaran
    transaksi.push({
        id: Date.now().toString(),
        nama: nama,
        jumlah: jumlah,
        kategori: kategori,
        jenis: jenis,
        tanggal: tanggalHariIni(),

        //Simpan informasi alokasi tabungan
        targetTabunganId:
            jenis === "pemasukan" && targetDipilih
                ? targetDipilih.id
                : null,

        nominalAlokasi:
            jenis === "pemasukan" && targetDipilih
                ? nominalAlokasi
                : 0
    });

    // Tambahkan nominal ke target tabungan yang dipilih
    if (jenis === "pemasukan" && targetDipilih && nominalAlokasi > 0) {
        targetDipilih.terkumpul =
            (Number(targetDipilih.terkumpul) || 0) + nominalAlokasi;

        simpanTargetTabungan();
        tampilkanTargetTabungan();
    }

    simpanTransaksi();
    updateSaldo();
    buatFilterBulan();
    tampilkanTransaksi();
    tampilkanGrafik();

    // Kosongkan form setelah transaksi tersimpan
    if (jenis === "pemasukan") {
        document.getElementById("jumlah").value = "";

        const inputNama = document.getElementById("namaTransaksi");
        if (inputNama) inputNama.value = "";

        const inputAlokasi = document.getElementById("jumlahAlokasi");
        if (inputAlokasi) inputAlokasi.value = "";

        const pilihanTarget = document.getElementById("targetAlokasi");
        if (pilihanTarget) pilihanTarget.value = "";

        cekKategori();
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
    const filterBulan = document.getElementById("filterBulan");
    const inputCari = document.getElementById("cariTransaksi");
    const filterJenis = document.getElementById("filterJenis");

    if (!daftar) return;

    const bulanDipilih = filterBulan
        ? filterBulan.value
        : "semua";

    const kataKunci = inputCari
        ? inputCari.value.trim().toLowerCase()
        : "";

    const jenisDipilih = filterJenis
        ? filterJenis.value
        : "semua";

    const daftarFilter = transaksi.filter(function(item) {
        const cocokBulan =
            bulanDipilih === "semua" ||
            (
                item.tanggal &&
                item.tanggal.substring(0, 7) === bulanDipilih
            );

        const cocokNama = String(item.nama || "")
            .toLowerCase()
            .includes(kataKunci);

        const cocokJenis =
            jenisDipilih === "semua" ||
            item.jenis === jenisDipilih;

        return cocokBulan && cocokNama && cocokJenis;
    });

    daftar.replaceChildren();

    if (daftarFilter.length === 0) {
        const pesan = document.createElement("p");

        if (transaksi.length === 0) {
            pesan.textContent = "Belum ada transaksi.";
        } else {
            pesan.textContent =
                "Tidak ada transaksi yang sesuai dengan filter.";
        }

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
            item.jenis === "pemasukan"
                ? "pemasukan"
                : "pengeluaran"
        );

        const tanda =
            item.jenis === "pemasukan" ? "+" : "-";

        nominal.textContent =
            tanda + " " + formatRupiah(item.jumlah);

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

    // Ambil transaksi sebelum dihapus
    const item = transaksi[index];

    // Kembalikan alokasi ke target tabungan
    if (
        item.jenis === "pemasukan" &&
        item.targetTabunganId &&
        Number(item.nominalAlokasi) > 0
    ) {
        const target = targetTabungan.find(
            t => String(t.id) === String(item.targetTabunganId)
        );

        if (target) {
            target.terkumpul = Math.max(
                0,
                (Number(target.terkumpul) || 0) -
                Number(item.nominalAlokasi)
            );

            simpanTargetTabungan();
            tampilkanTargetTabungan();
        }
    }

    // Hapus transaksi
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
    muatTargetTabungan();
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
    const kategori = document.getElementById("kategori");
    const wadahNama = document.getElementById("namaTransaksiContainer");
    const inputNama = document.getElementById("namaTransaksi");

    if (!kategori || !wadahNama || !inputNama) return;

    const perluNama = kategori.value === "lainnya";

    wadahNama.hidden = !perluNama;
    inputNama.required = perluNama;

    if (!perluNama) {
        inputNama.value = "";
    }
}


/* =====================================
   STATISTIK KEUANGAN
   ===================================== */

function tampilkanStatistik() {
    const filter = document.getElementById("filterBulanStatistik");

    if (!filter) return;

    // Ambil semua bulan yang memiliki transaksi
    const bulanTersedia = [
        ...new Set(
            transaksi
                .filter(item => item.tanggal)
                .map(item => item.tanggal.substring(0, 7))
        )
    ].sort().reverse();

    // Simpan pilihan periode sebelumnya
    const pilihanLama = filter.value;

    filter.replaceChildren();

    const opsiSemua = document.createElement("option");
    opsiSemua.value = "semua";
    opsiSemua.textContent = "Semua Periode";
    filter.appendChild(opsiSemua);

    bulanTersedia.forEach(function(bulan) {
        const opsi = document.createElement("option");
        opsi.value = bulan;
        opsi.textContent = formatBulan(bulan);
        filter.appendChild(opsi);
    });

    filter.value = bulanTersedia.includes(pilihanLama)
        ? pilihanLama
        : "semua";

    // Hitung ulang ketika periode diganti
    filter.onchange = tampilkanStatistikData;

    tampilkanStatistikData();
}

function tampilkanStatistikData() {
    const filter = document.getElementById("filterBulanStatistik");
    const periode = filter ? filter.value : "semua";

    const data = transaksi.filter(function(item) {
        return periode === "semua" ||
            (
                item.tanggal &&
                item.tanggal.substring(0, 7) === periode
            );
    });

    const pemasukan = data
        .filter(item => item.jenis === "pemasukan")
        .reduce((total, item) => total + Number(item.jumlah || 0), 0);

    const pengeluaran = data
        .filter(item => item.jenis === "pengeluaran")
        .reduce((total, item) => total + Number(item.jumlah || 0), 0);

    const daftarPengeluaran = data.filter(
        item => item.jenis === "pengeluaran"
    );

    const rataRata = daftarPengeluaran.length
        ? pengeluaran / daftarPengeluaran.length
        : 0;

    const terbesar = daftarPengeluaran.reduce(function(tertinggi, item) {
        return Number(item.jumlah) > Number(tertinggi?.jumlah || 0)
            ? item
            : tertinggi;
    }, null);

    // Cari kategori pengeluaran dengan total nominal terbesar
    const totalKategori = {};

    daftarPengeluaran.forEach(function(item) {
        const kategori = item.kategori || "lainnya";

        totalKategori[kategori] =
            (totalKategori[kategori] || 0) + Number(item.jumlah || 0);
    });

    const kategoriTerbesar = Object.entries(totalKategori)
        .sort((a, b) => b[1] - a[1])[0];

    document.getElementById("statTotalTransaksi").textContent =
        data.length.toLocaleString("id-ID");

    document.getElementById("statRataPengeluaran").textContent =
        formatRupiah(Math.round(rataRata));

    document.getElementById("statPengeluaranTerbesar").textContent =
        formatRupiah(terbesar ? Number(terbesar.jumlah) : 0);

    document.getElementById("statNamaPengeluaran").textContent =
        terbesar ? terbesar.nama : "Belum ada data";

    document.getElementById("statKategoriTerbesar").textContent =
        kategoriTerbesar
            ? kategoriTerbesar[0].charAt(0).toUpperCase() +
              kategoriTerbesar[0].slice(1)
            : "Belum ada data";

    // Buat grafik perbandingan
    const wadahGrafik = document.getElementById("grafikStatistik");
    wadahGrafik.replaceChildren();

    const nilaiMaksimum = Math.max(pemasukan, pengeluaran, 1);

    [
        {
            nama: "Pemasukan",
            jumlah: pemasukan,
            kelas: "statistik-bar-pemasukan"
        },
        {
            nama: "Pengeluaran",
            jumlah: pengeluaran,
            kelas: "statistik-bar-pengeluaran"
        }
    ].forEach(function(item) {
        const baris = document.createElement("div");
        baris.className = "statistik-baris";

        const label = document.createElement("div");
        label.className = "statistik-bar-label";

        const nama = document.createElement("span");
        nama.textContent = item.nama;

        const nominal = document.createElement("strong");
        nominal.textContent = formatRupiah(item.jumlah);

        label.append(nama, nominal);

        const lintasan = document.createElement("div");
        lintasan.className = "statistik-bar-lintasan";

        const isi = document.createElement("div");
        isi.className = item.kelas;
        isi.style.width =
            (item.jumlah / nilaiMaksimum * 100) + "%";

        lintasan.appendChild(isi);
        baris.append(label, lintasan);
        wadahGrafik.appendChild(baris);
    });
}


/* =====================================
   TARGET TABUNGAN ZORA
   ===================================== */

   const KUNCI_TARGET_TABUNGAN = "zoraTargetTabungan";
   let targetTabungan = [];
   
function simpanTargetTabungan() {
       localStorage.setItem(
           KUNCI_TARGET_TABUNGAN,
           JSON.stringify(targetTabungan)
       );
   }
   
function muatTargetTabungan() {
       try {
           const data = JSON.parse(
               localStorage.getItem(KUNCI_TARGET_TABUNGAN) || "[]"
           );
   
           targetTabungan = Array.isArray(data) ? data : [];
       } catch (error) {
           targetTabungan = [];
           console.error("Data target tabungan gagal dibaca:", error);
       }
   
       perbaruiPilihanTarget();
       tampilkanTargetTabungan();
   }
   
function perbaruiPilihanTarget() {
       const pilihanManual = document.getElementById("pilihTargetManual");
       const pilihanAlokasi = document.getElementById("targetAlokasi");
   
       [pilihanManual, pilihanAlokasi].forEach(function(select) {
           if (!select) return;
   
           const pilihanLama = select.value;
           select.replaceChildren();
   
           const opsiAwal = document.createElement("option");
           opsiAwal.value = "";
   
           opsiAwal.textContent = select.id === "targetAlokasi"
               ? "Tidak dialokasikan"
               : "Pilih target tabungan";
   
           select.appendChild(opsiAwal);
   
           targetTabungan.forEach(function(target) {
               const opsi = document.createElement("option");
               opsi.value = target.id;
               opsi.textContent = target.nama;
               select.appendChild(opsi);
           });
   
           if (targetTabungan.some(target => target.id === pilihanLama)) {
               select.value = pilihanLama;
           }
       });
   }
   
function buatTargetTabungan() {
       const inputNama = document.getElementById("namaTarget");
       const inputNominal = document.getElementById("nominalTarget");
       const inputAwal = document.getElementById("tabunganAwal");
   
       const nama = inputNama.value.trim();
       const nominal = Number(inputNominal.value.replace(/\D/g, ""));
       const tabunganAwal = inputAwal.value.trim() === ""
           ? 0
           : Number(inputAwal.value.replace(/\D/g, ""));
   
       if (!nama) {
           alert("Masukkan nama target tabungan.");
           inputNama.focus();
           return;
       }
   
       if (!Number.isSafeInteger(nominal) || nominal <= 0) {
           alert("Nominal target harus lebih dari Rp 0.");
           inputNominal.focus();
           return;
       }
   
       if (
           !Number.isSafeInteger(tabunganAwal) ||
           tabunganAwal < 0 ||
           tabunganAwal > nominal
       ) {
           alert("Tabungan awal harus antara Rp 0 dan nominal target.");
           inputAwal.focus();
           return;
       }
   
       targetTabungan.push({
           id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
           nama: nama,
           nominal: nominal,
           terkumpul: tabunganAwal
       });
   
       simpanTargetTabungan();
       perbaruiPilihanTarget();
       tampilkanTargetTabungan();
   
       inputNama.value = "";
       inputNominal.value = "";
       inputAwal.value = "";
   
       alert("Target tabungan berhasil dibuat!");
   }
   
function tambahTabunganManual() {
       const pilihan = document.getElementById("pilihTargetManual");
       const inputNominal = document.getElementById("nominalManual");
   
       const target = targetTabungan.find(
           item => item.id === pilihan.value
       );
   
       const nominal = Number(inputNominal.value.replace(/\D/g, ""));
   
       if (!target) {
           alert("Pilih target tabungan terlebih dahulu.");
           return;
       }
   
       if (!Number.isSafeInteger(nominal) || nominal <= 0) {
           alert("Masukkan nominal tabungan yang valid.");
           inputNominal.focus();
           return;
       }
   
       const sisa = target.nominal - target.terkumpul;
   
       if (nominal > sisa) {
           alert("Nominal melebihi sisa target. Sisa target: " + formatRupiah(sisa));
           return;
       }
   
       target.terkumpul += nominal;
   
       simpanTargetTabungan();
       tampilkanTargetTabungan();
   
       inputNominal.value = "";
   
       alert("Tabungan berhasil ditambahkan!");
   }
   
function tampilkanTargetTabungan() {
    const targetKosong = document.getElementById("targetKosong");

    if (targetKosong) {
        targetKosong.hidden = targetTabungan.length > 0;
    }
       const daftar = document.getElementById("daftarTargetTabungan");
       if (!daftar) return;
   
       daftar.replaceChildren();
   
       if (targetTabungan.length === 0) {
           const pesan = document.createElement("p");
           pesan.textContent = "Belum ada target tabungan.";
           daftar.appendChild(pesan);
           return;
       }
   
       targetTabungan.forEach(function(target) {
           const kartu = document.createElement("article");
           kartu.className = "kartu-target";
   
           const terkumpul = Number(target.terkumpul) || 0;
           const nominal = Number(target.nominal) || 0;
           const persentase = nominal > 0
               ? Math.min(100, Math.floor(terkumpul / nominal * 100))
               : 0;
           const sisa = Math.max(0, nominal - terkumpul);
   
           const header = document.createElement("div");
           header.className = "target-header";
   
           const nama = document.createElement("h4");
           nama.className = "target-nama";
           nama.textContent = target.nama;
   
           const persen = document.createElement("span");
           persen.className = "target-persentase";
           persen.textContent = persentase + "%";
   
           header.append(nama, persen);
   
           const ringkasan = document.createElement("p");
           ringkasan.className = "target-nominal";
           ringkasan.textContent =
               formatRupiah(terkumpul) + " / " + formatRupiah(nominal);
   
           const keterangan = document.createElement("p");
           keterangan.className = "target-sisa";
           keterangan.textContent = sisa > 0
               ? "Kurang " + formatRupiah(sisa) + " lagi"
               : "Target tabungan telah tercapai!";
   
           const lintasan = document.createElement("div");
           lintasan.className = "target-progress";
   
           const isi = document.createElement("div");
           isi.className = "target-progress-isi";
           isi.style.width = persentase + "%";
   
           lintasan.appendChild(isi);
           kartu.append(header, ringkasan, keterangan, lintasan);
   
           if (persentase === 100) {
               const selesai = document.createElement("span");
               selesai.className = "target-selesai";
               selesai.textContent = "TARGET TERCAPAI";
               kartu.appendChild(selesai);
           }
   
           const tombolHapus = document.createElement("button");
           tombolHapus.type = "button";
           tombolHapus.className = "target-hapus";
           tombolHapus.textContent = "Hapus Target";
   
           tombolHapus.addEventListener("click", function() {
               hapusTargetTabungan(target.id);
           });
   
           kartu.appendChild(tombolHapus);
           daftar.appendChild(kartu);
       });
   }
   
function hapusTargetTabungan(id) {
       const target = targetTabungan.find(item => item.id === id);
       if (!target) return;
   
       if (!confirm('Hapus target "' + target.nama + '"?')) {
           return;
       }
   
       targetTabungan = targetTabungan.filter(item => item.id !== id);
   
       simpanTargetTabungan();
       perbaruiPilihanTarget();
       tampilkanTargetTabungan();
   }
   

function tampilkanFormTarget(tampilkan) {
    const form = document.getElementById("formTargetBaru");
    const targetKosong = document.getElementById("targetKosong");

    if (!form) return;

    form.hidden = !tampilkan;

    // Tampilan kosong hanya muncul jika belum ada target.
    if (targetKosong) {
        targetKosong.hidden =
            targetTabungan.length > 0 || tampilkan;
    }

    if (tampilkan) {
        document.getElementById("namaTarget").focus();
    }
}
