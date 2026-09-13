let pemasukan = 0;
let pengeluaran = 0;
let transaksi = [];

function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka);
}

function tambahTransaksi() {

    let nama = document.getElementById("namaTransaksi").value;
    let jumlah = Number(document.getElementById("jumlah").value);
    let jenis = document.getElementById("jenis").value;
    let kategori = document.getElementById("kategori").value;

    if (
        kategori === "gaji" ||
        kategori === "uang-saku" ||
        kategori === "tabungan"
    ) {

        if (kategori === "gaji") {
            nama = "Gaji";
        }

        if (kategori === "uang-saku") {
            nama = "Uang Saku";
        }

        if (kategori === "tabungan") {
            nama = "Tabungan";
        }
    }

    if (nama === "" || jumlah <= 0) {
        alert("Isi nama transaksi dan jumlah uang terlebih dahulu!");
        return;
    }

    if (jenis === "pemasukan") {

        pemasukan += jumlah;
        
    } else {

        pengeluaran += jumlah;

    }

    transaksi.push({
        nama: nama,
        jumlah: jumlah,
        jenis: jenis,
        kategori: kategori
    });

    simpanTransaksi();

    let saldo = pemasukan - pengeluaran;

    document.getElementById("pemasukan").textContent = 
        formatRupiah(pemasukan);

    document.getElementById("pengeluaran").textContent = 
        formatRupiah(pengeluaran);

    document.getElementById("saldo").textContent = 
        formatRupiah(saldo);

    tampilkanTransaksi();

    document.getElementById("namaTransaksi").value = "";
    document.getElementById("jumlah").value = "";
}

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

function tampilkanTransaksi() {

    let daftar = document.getElementById("daftarTransaksi")

    daftar.innerHTML = "";

    if (transaksi.length === 0) {

        daftar.innerHTML = "<p>Belum ada transaksi.</p>";

        return;
    }

    transaksi.forEach(function(item) {

        let div = document.createElement("div");

        div.classList.add("transaksi");

        let warna = item.jenis === "pemasukan"
            ? "pemasukan"
            : "pengeluaran";

        let tanda = item.jenis === "pemasukan"
            ? "+"
            : "-";

        div.innerHTML = `
            <div class="transaksi-info">

                <div class="transaksi-icon">
                    ${getIcon(item.kategori)}
                </div>

                <div>
                    <h3>${item.nama}</h3>
                    <p>${item.jenis}</p>
                </div>

            </div>
            
            <div class="nominal ${warna}">
                ${tanda} ${formatRupiah(item.jumlah)}
            </div>

            <button 
                class="hapus-btn"
                onclick="hapusTransaksi(${transaksi.indexOf(item)})"
                title="Hapus transaksi"
            >
                <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M3 6h18"></path>
                    <path d="M8 6V4h8v2"></path>
                    <path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v5"></path>
                    <path d="M14 11v5"></path>
                </svg>
            </button>
        `;

        daftar.appendChild(div);
    });
}

function updateSaldo() {

    pemasukan = 0;
    pengeluaran = 0;

    transaksi.forEach(function(item) {

        if (item.jenis === "pemasukan") {
            
            pemasukan += item.jumlah;

        } else {

            pengeluaran += item.jumlah;

        }

    });

    let saldo = pemasukan - pengeluaran;

    document.getElementById("pemasukan").textContent = 
        formatRupiah(pemasukan);

    document.getElementById("pengeluaran").textContent = 
        formatRupiah(pengeluaran);

    document.getElementById("saldo").textContent = 
        formatRupiah(saldo);
}

function hapusTransaksi(index) {

    transaksi.splice(index, 1);

    updateSaldo();
    tampilkanTransaksi();
    simpanTransaksi();
}

function cekKategori() {

    let kategori = document.getElementById("kategori").value;
    let namaContainer = document.getElementById("namaTransaksiContainer");
    let jenis = document.getElementById("jenis");

    if (
        kategori === "gaji" ||
        kategori === "uang-saku" ||
        kategori === "tabungan"
    ) {
        namaContainer.style.display = "none";
    } else {
        namaContainer.style.display = "block";
    }

    if (
        kategori === "gaji" ||
        kategori === "uang-saku" ||
        kategori === "tabungan"
    ) {
        jenis.value = "pemasukan";
    } else if (
        kategori === "makanan" ||
        kategori === "transportasi" ||
        kategori === "belanja" ||
        kategori === "hiburan" ||
        kategori === "pendidikan"
    ) {
        jenis.value = "pengeluaran";
    }

}

function daftar() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value;
    let konfirmasiPassword = document.getElementById("konfirmasiPassword").value;

    if (username === "" || password === "" || konfirmasiPassword === "") {
        alert("Semua kolom harus diisi!");
        return;
    }

    if (password !== konfirmasiPassword) {
        alert("Konfirmasi password tidak sama!");
        return;
    }

    let dataAkun = localStorage.getItem("akunZora");

    let daftarAkun = [];

    if (dataAkun !== null) {
        let data = JSON.parse(dataAkun);

        if (Array.isArray(data)) {
            daftarAkun = data;
        } else {
            daftarAkun = [data];
        }
    }

    let akunSudahAda = daftarAkun.some(function(akun) {
        return akun.username === username;
    });

    if (akunSudahAda) {
        alert("Username sudah digunakan!");
        return;
    }

    let akunBaru = {
        username: username,
        password: password,
        transaksi: []
    };

    daftarAkun.push(akunBaru);

    localStorage.setItem("akunZora", JSON.stringify(daftarAkun));

    alert("Akun berhasil dibuat!");

    window.location.href = "login.html";
}

function login() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value;

    if (username === "" || password === "") {
        alert("Username dan password harus diisi!");
        return;
    }

    let dataAkun = localStorage.getItem("akunZora");

    if (dataAkun === null) {
        alert("Belum ada akun yang terdaftar!");
        return;
    }

    let data = JSON.parse(dataAkun);

    let daftarAkun;

    if (Array.isArray(data)) {
        daftarAkun = data;
    } else {
        daftarAkun = [data];
    }

    let akunDitemukan = daftarAkun.find(function(akun) {
        return akun.username === username &&
               akun.password === password;
    });

    if (akunDitemukan) {
        alert("Login berhasil!");

        localStorage.setItem("akunAktif", username);

        window.location.href = "index.html";
    } else {
        alert("Username atau password salah!");
    }
}

function ambilAkunAktif() {
    let usernameAktif = localStorage.getItem("akunAktif");
    let dataAkun = localStorage.getItem("akunZora");

    if (usernameAktif === null || dataAkun === null) {
        return null;
    }

    let daftarAkun = JSON.parse(dataAkun);

    let akun = daftarAkun.find(function(akun) {
        return akun.username === usernameAktif;
    });

    return akun || null;
}

function muatTransaksi() {
    let akun = ambilAkunAktif();

    if (akun === null) {
        return;
    }

    transaksi = akun.transaksi;

    updateSaldo();
    tampilkanTransaksi();
}

if (document.getElementById("daftarTransaksi")) {
    muatTransaksi();
}

function simpanTransaksi() {
    let usernameAktif = localStorage.getItem("akunAktif");
    let dataAkun = localStorage.getItem("akunZora");

    if (usernameAktif === null || dataAkun === null) {
        return;
    }

    let daftarAkun = JSON.parse(dataAkun);

    let akun = daftarAkun.find(function(akun) {
        return akun.username === usernameAktif;
    });

    if (akun === undefined) {
        return;
    }

    akun.transaksi = transaksi;

    localStorage.setItem("akunZora", JSON.stringify(daftarAkun));
}

function logout() {
    localStorage.removeItem("akunAktif");

    window.location.href="login.html";
}