/**
 * Data Simulasi untuk Prototipe TERANG (Web In Action 2026)
 * Wilayah Studi Kasus: Kecamatan Coblong, Kota Bandung
 * Seluruh data laporan, catatan keputusan, dan informasi anggaran di bawah ini
 * adalah data simulasi untuk keperluan demonstrasi fungsionalitas produk.
 */

export const DEMO_STATISTICS = {
  region: "Kecamatan Coblong, Kota Bandung",
  totalReports: 142,
  uniqueIssues: 98,
  inVerification: 14,
  inHandling: 27,
  awaitingConfirmation: 19,
  completed: 82,
  recurringDetected: 18,
  avgResponseTime: "4.2 Hari",
  lastUpdated: "3 November 2026, 14:00 WIB"
};

export const LANDING_STEPS = [
  {
    number: "01",
    total: "03",
    title: "Laporan diterima",
    description: "Lokasi, kategori, dan foto kerusakan yang kamu kirim tercatat di TERANG."
  },
  {
    number: "02",
    total: "03",
    title: "Laporan diperiksa",
    description: "Admin memeriksa bukti awal dan menentukan langkah berikutnya."
  },
  {
    number: "03",
    total: "03",
    title: "Pantau hasilnya",
    description: "Lihat perkembangan laporan dan beri tanggapan jika masalah belum selesai."
  }
];

export const LANDING_RADAR_CASE = {
  previousId: "TRG-011",
  previousStatus: "Selesai",
  newId: "TRG-024",
  newStatus: "Menunggu verifikasi",
  note: "Titik yang sama • Perlu diperiksa admin",
  badgeText: "Foto Ilustrasi • Data Simulasi",
  bgImage: "/images/figma-radar-bg.jpg",
  thumbImage: "/images/figma-radar-thumb.jpg"
};

export const LANDING_TRANSPARENCY_CASE = {
  reportId: "TRG-024",
  badgeText: "TRG-024 • Data Simulasi",
  priority: "Urgent",
  reason: "Berisiko bagi pengguna jalan",
  verifiedMeta: "Diverifikasi oleh admin • 12 Mei",
  budgetLabel: "Jejak Anggaran",
  budgetStatus: "Belum terverifikasi"
};

export const SAMPLE_REPORTS = [
  {
    id: "TRG-024",
    title: "Kerusakan Permukaan Aspal Berulang di Titik Tambalan Lama",
    category: "Jalan Rusak",
    subdistrict: "Coblong",
    ward: "Lebakgede",
    address: "Jl. Dipatiukur, Kel. Lebakgede, Kec. Coblong",
    coordinates: "-6.8924, 107.6178",
    status: "Menunggu Verifikasi",
    urgency: "Urgent",
    urgencyReason: "Berisiko bagi pengguna jalan",
    radarStatus: "Titik yang sama • Perlu diperiksa admin",
    radarDetails: {
      isRecurring: true,
      linkedReportId: "TRG-011",
      previousFixDate: "14 Februari 2026",
      intervalDays: 87,
      rootCauseHypothesis: "Tambalan aspal sebelumnya mengelupas kembali akibat genangan air dan beban kendaraan."
    },
    observedDate: "11 Mei 2026",
    reportedAt: "12 Mei 2026, 09:20 WIB",
    description: "Tambalan aspal pada titik laporan TRG-011 yang sebelumnya dinyatakan selesai kembali retak dan berlubang, membahayakan pengendara roda dua.",
    safetyImpact: "Berisiko bagi pengguna jalan, terutama pengendara motor pada malam hari atau saat hujan.",
    photoUrl: "/images/figma-radar-thumb.jpg",
    repairPhotoUrl: "/images/figma-radar-bg.jpg",
    isDemoData: true,
    decisionTrail: [
      {
        step: 1,
        time: "12 Mei 2026, 09:20 WIB",
        actor: "Warga Pelapor",
        action: "Laporan diterima",
        status: "Menunggu Verifikasi",
        note: "Lokasi, kategori, dan foto kerusakan yang dikirim warga tercatat di TERANG dan terdeteksi berada di titik yang sama dengan TRG-011."
      },
      {
        step: 2,
        time: "12 Mei 2026, 14:10 WIB",
        actor: "Admin Verifikator",
        action: "Penetapan Prioritas: Urgent",
        status: "Terverifikasi",
        note: "Berisiko bagi pengguna jalan. Diverifikasi oleh admin • 12 Mei."
      }
    ],
    budgetTrail: {
      packageName: "Belum ditautkan ke paket anggaran spesifik",
      agency: "Menunggu konfirmasi instansi terkait",
      fiscalYear: "TA 2026",
      sourceUrl: "-",
      linkageStatus: "Belum terverifikasi",
      disclaimer: "Informasi keterkaitan anggaran hanya ditampilkan apabila sumber telah terverifikasi."
    },
    citizenConfirmation: {
      totalConfirmations: 5,
      stillDamagedCount: 5,
      fixedProperlyCount: 0,
      damagedAgainCount: 5,
      recentComment: "Tambalan yang dulu sudah mengelupas lagi, mohon dicek kembali."
    }
  },
  {
    id: "TRG-2026-088",
    title: "Ambles Bahu Jalan dan Lubang Melintang Dekat Halte",
    category: "Jalan Rusak",
    subdistrict: "Coblong",
    ward: "Lebakgede",
    address: "Jl. Dipatiukur No. 45 (depan Halte Bus Kampus), Kel. Lebakgede",
    coordinates: "-6.8924, 107.6178",
    status: "Dalam Penanganan",
    urgency: "Most Urgent",
    urgencyReason: "Kedalaman amblesan >14 cm di lajur utama bus dan sepeda motor; memicu risiko kecelakaan fatal saat hujan deras.",
    radarStatus: "Indikasi Kerusakan Berulang (Terkonfirmasi)",
    radarDetails: {
      isRecurring: true,
      linkedReportId: "TRG-2025-019",
      previousFixDate: "14 November 2025",
      intervalDays: 106,
      rootCauseHypothesis: "Remukan saluran utilitas bawah tanah yang menyebabkan rongga pondasi aspal amblas kembali."
    },
    observedDate: "28 Februari 2026",
    reportedAt: "01 Maret 2026, 08:15 WIB",
    description: "Amblesan permukaan aspal berdiameter 80 cm dan kedalaman 14 cm persis di titik henti kendaraan. Air sering tergenang sehingga lubang tidak terlihat pengendara dari arah selatan.",
    safetyImpact: "Tinggi: Jalur ramai mahasiswa dan angkutan kota, rawan pengendara roda dua tergelincir.",
    photoUrl: "/images/the-big-hole-in-ubud-s-main.jpg",
    repairPhotoUrl: "/images/fix-the-water-so-you-can-fix.jpg",
    isDemoData: true,
    decisionTrail: [
      {
        step: 1,
        time: "01 Mar 2026, 08:15 WIB",
        actor: "Warga Pelapor (Terverifikasi No. Kontak)",
        action: "Laporan Dibuat",
        status: "Menunggu Verifikasi",
        note: "Foto kondisi kerusakan dan titik koordinat GPS Coblong berhasil dicatat."
      },
      {
        step: 2,
        time: "01 Mar 2026, 10:45 WIB",
        actor: "Siti Rahmawati (Admin Verifikator Wilayah 3)",
        action: "Human Crosscheck & Validasi Bukti",
        status: "Terverifikasi",
        note: "Bukti visual valid. Radius 50m mendeteksi bekas perbaikan TRG-2025-019 di koordinat yang sama. Diberi penanda Indikasi Kerusakan Berulang."
      },
      {
        step: 3,
        time: "01 Mar 2026, 11:20 WIB",
        actor: "Siti Rahmawati (Admin Verifikator Wilayah 3)",
        action: "Penetapan Smart Priority",
        status: "Terverifikasi",
        note: "Rekomendasi sistem diterima: Status Urgensi ditetapkan 'Most Urgent' karena berada pada jalur angkutan umum aktif dan kedalaman melebihi ambang batas aman (10 cm)."
      },
      {
        step: 4,
        time: "02 Mar 2026, 09:30 WIB",
        actor: "Mandor Lapangan Unit Reaksi Cepat Coblong",
        action: "Pekerjaan Fisik Dimulai",
        status: "Dalam Penanganan",
        note: "Pemasangan rambu pengaman, pengupasan aspal rusak, dan investigasi rembesan air pipa drainase sebelum penambalan permanen."
      }
    ],
    budgetTrail: {
      packageName: "Sub-Kegiatan Pemeliharaan Berkala dan Tambal Cepat Jalan Kota Bandung Zona Utara (Coblong)",
      agency: "Dinas Sumber Daya Air dan Bina Marga (DSDABM) Kota Bandung",
      fiscalYear: "TA 2026",
      sourceUrl: "https://sirup.lkpp.go.id (Data Rencana Pengadaan Publik)",
      linkageStatus: "Keterkaitan Administratif Terverifikasi",
      disclaimer: "Pagu paket pemeliharaan merupakan pagu zona koridor dan bukan alokasi biaya spesifik satu titik lubang ini."
    },
    citizenConfirmation: {
      required: true,
      status: "Menunggu Penuntasan Fisik",
      votes: { stillBroken: 4, repaired: 0, pending: 12 }
    }
  },
  {
    id: "TRG-2026-092",
    title: "Saluran Drainase Trotoar Tersumbat Sedimen dan Sampah",
    category: "Drainase",
    subdistrict: "Coblong",
    ward: "Sekeloa",
    address: "Jl. Sekeloa Utara Gang 3 RT 02/RW 04, Kel. Sekeloa",
    coordinates: "-6.8876, 107.6195",
    status: "Terverifikasi",
    urgency: "Urgent",
    urgencyReason: "Menyebabkan limpasan air ke jalan permukiman padat dan mengikis lapisan semen jalan lingkungan.",
    radarStatus: "Bukan Kerusakan Berulang",
    radarDetails: {
      isRecurring: false,
      linkedReportId: null,
      previousFixDate: null,
      intervalDays: null,
      rootCauseHypothesis: "Akumulasi sampah dedaunan dan sedimentasi tanah setelah curah hujan ekstrem sepekan terakhir."
    },
    observedDate: "01 Maret 2026",
    reportedAt: "01 Maret 2026, 14:30 WIB",
    description: "Saluran air selebar 40 cm meluap ke badan jalan setiap hujan lebih dari 30 menit. Penutup beton pecah sebagian dan membahayakan pejalan kaki anak sekolah.",
    safetyImpact: "Sedang: Mengganggu akses warga gang dan berpotensi menjadi sarang jentik nyamuk.",
    photoUrl: "/images/saluran-tersumbat.jpg",
    repairPhotoUrl: null,
    isDemoData: true,
    decisionTrail: [
      {
        step: 1,
        time: "01 Mar 2026, 14:30 WIB",
        actor: "Warga Pelapor",
        action: "Laporan Masuk",
        status: "Menunggu Verifikasi",
        note: "Disertai 2 foto saluran meluap."
      },
      {
        step: 2,
        time: "02 Mar 2026, 08:10 WIB",
        actor: "Ahmad Fauzi (Verifikator)",
        action: "Verifikasi Lokasi & Klasifikasi",
        status: "Terverifikasi",
        note: "Dikonfirmasi lokasi gang Sekeloa Utara. Urgensi disetujui Urgent untuk mencegah banjir lokal saat hujan sore hari."
      }
    ],
    budgetTrail: {
      packageName: "Swakelola Pembersihan dan Pemeliharaan Rutin Saluran Drainase Mikro Coblong",
      agency: "Kecamatan Coblong & DSDABM",
      fiscalYear: "TA 2026",
      sourceUrl: "https://sirup.lkpp.go.id",
      linkageStatus: "Paket Berpotensi Terkait (Belum Terverifikasi Lapangan)",
      disclaimer: "Kegiatan swakelola rutin pembersihan sedimentasi."
    },
    citizenConfirmation: {
      required: true,
      status: "Menunggu Jadwal Pengerjaan",
      votes: { stillBroken: 8, repaired: 0, pending: 3 }
    }
  },
  {
    id: "TRG-2026-079",
    title: "Lubang Melengkung Jalur Penurunan Cisitu Lama",
    category: "Jalan Rusak",
    subdistrict: "Coblong",
    ward: "Dago",
    address: "Jl. Cisitu Lama No. 12 (turunan arah Sangkuriang), Kel. Dago",
    coordinates: "-6.8831, 107.6124",
    status: "Menunggu Konfirmasi",
    urgency: "Urgent",
    urgencyReason: "Terletak tepat di tikungan menurun curam; sangat berbahaya bagi rem kendaraan matic.",
    radarStatus: "Indikasi Kerusakan Berulang (Terkonfirmasi)",
    radarDetails: {
      isRecurring: true,
      linkedReportId: "TRG-2025-044",
      previousFixDate: "19 Desember 2025",
      intervalDays: 71,
      rootCauseHypothesis: "Ketiadaan saluran air tepi jalan membuat aliran air hujan terus mengikis lapisan aspal tambalan."
    },
    observedDate: "20 Februari 2026",
    reportedAt: "21 Februari 2026, 09:00 WIB",
    description: "Lubang tajam berkedalaman 11 cm di tepi turunan. Perbaikan tambal sulam akhir tahun 2025 sudah terkelupas kembali karena tergerus air hujan.",
    safetyImpact: "Tinggi: Tikungan turunan curam, sering terjadi pengereman mendadak pengendara motor.",
    photoUrl: "/images/ubud-jalan-raya-pothole-2009.jpg",
    repairPhotoUrl: "/images/fix-the-water-so-you-can-fix.jpg",
    isDemoData: true,
    decisionTrail: [
      {
        step: 1,
        time: "21 Feb 2026, 09:00 WIB",
        actor: "Warga Cisitu",
        action: "Laporan Dibuat",
        status: "Menunggu Verifikasi",
        note: "Mencantumkan riwayat kerusakan sebelumnya."
      },
      {
        step: 2,
        time: "21 Feb 2026, 13:00 WIB",
        actor: "Siti Rahmawati (Admin)",
        action: "Validasi & Flag Radar",
        status: "Terverifikasi",
        note: "Terbukti berulang dari TRG-2025-044. Catatan rekomendasi: perlu perbaikan gorong-gorong samping agar tidak rusak lagi."
      },
      {
        step: 3,
        time: "25 Feb 2026, 16:30 WIB",
        actor: "Petugas Lapangan DSDABM",
        action: "Pekerjaan Penambalan & Pembuatan Tali Air Selesai",
        status: "Menunggu Konfirmasi",
        note: "Foto hasil perbaikan cold-mix aspal dan tali air telah diunggah. Menunggu konfirmasi warga sekitar selama 14 hari."
      }
    ],
    budgetTrail: {
      packageName: "Tanggap Darurat Penambalan Jalan Wilayah Coblong",
      agency: "DSDABM Kota Bandung",
      fiscalYear: "TA 2026",
      sourceUrl: "https://sirup.lkpp.go.id",
      linkageStatus: "Keterkaitan Administratif Terverifikasi",
      disclaimer: "Pekerjaan tanggap darurat unit reaksi cepat."
    },
    citizenConfirmation: {
      required: true,
      status: "Verifikasi Lapangan Warga Aktif",
      votes: { stillBroken: 1, repaired: 14, pending: 2 }
    }
  },
  {
    id: "TRG-2026-064",
    title: "Tiang PJU Padam Sepanjang Trotoar Barat Ganesha",
    category: "Penerangan Jalan",
    subdistrict: "Coblong",
    ward: "Lebak Siliwangi",
    address: "Jl. Ganesha (depan gerbang barat ITB menuju Sasana Budaya Ganesha)",
    coordinates: "-6.8902, 107.6105",
    status: "Selesai",
    urgency: "Not Urgent",
    urgencyReason: "Masih terdapat pencahayaan sekunder dari penerangan gedung kampus; bukan jalan protokol cepat.",
    radarStatus: "Bukan Kerusakan Berulang",
    radarDetails: {
      isRecurring: false,
      linkedReportId: null,
      previousFixDate: null,
      intervalDays: null,
      rootCauseHypothesis: "Korsleting kabel jaringan bawah tanah pasca galian pipa fiber optik."
    },
    observedDate: "10 Februari 2026",
    reportedAt: "11 Februari 2026, 19:40 WIB",
    description: "4 tiang lampu penerangan jalan umum mati total selama 5 malam berturut-turut. Area trotoar gelap bagi pejalan kaki mahasiswa dan pelari malam.",
    safetyImpact: "Rendah ke Sedang: Rawan tindak kriminalitas malam dan tersandung akar pohon trotoar.",
    photoUrl: "/images/bandung-night-view-dago.jpg",
    repairPhotoUrl: "/images/bandung-night-view-dago.jpg",
    isDemoData: true,
    decisionTrail: [
      {
        step: 1,
        time: "11 Feb 2026, 19:40 WIB",
        actor: "Warga / Mahasiswa",
        action: "Laporan Dibuat",
        status: "Menunggu Verifikasi",
        note: "Dilengkapi foto 4 tiang yang padam berurutan."
      },
      {
        step: 2,
        time: "12 Feb 2026, 09:15 WIB",
        actor: "Hendra Wijaya (Admin PJU)",
        action: "Verifikasi & Koordinasi Dishub",
        status: "Terverifikasi",
        note: "Disposisi ke tim pemeliharaan PJU Dishub Kota Bandung."
      },
      {
        step: 3,
        time: "14 Feb 2026, 21:00 WIB",
        actor: "Tim Teknisi PJU Dishub",
        action: "Penggantian Fuse & Bohlam LED",
        status: "Menunggu Konfirmasi",
        note: "Penggantian komponen gardu dan 4 unit modul LED 90W."
      },
      {
        step: 4,
        time: "20 Feb 2026, 12:00 WIB",
        actor: "Admin TERANG",
        action: "Konfirmasi Tuntas oleh Warga",
        status: "Selesai",
        note: "23 warga mengonfirmasi lampu telah menyala normal tanpa kendala selama 6 hari pengamatan."
      }
    ],
    budgetTrail: {
      packageName: "Pemeliharaan Rutin Lampu Penerangan Jalan Umum (PJU) Kota Bandung Bagian Tengah & Utara",
      agency: "Dinas Perhubungan (Dishub) Kota Bandung",
      fiscalYear: "TA 2026",
      sourceUrl: "https://sirup.lkpp.go.id",
      linkageStatus: "Keterkaitan Administratif Terverifikasi",
      disclaimer: "Alokasi pemeliharaan lampu rutin terintegrasi."
    },
    citizenConfirmation: {
      required: false,
      status: "Tuntas Terkonfirmasi",
      votes: { stillBroken: 0, repaired: 23, pending: 0 }
    }
  }
];

export const RADAR_CASE_STUDY = {
  title: "Studi Kasus Radar: Lubang Berulang Jl. Sekeloa",
  firstIncident: {
    id: "TRG-2025-019",
    date: "14 November 2025",
    status: "Selesai (Ditambal Cold-Mix)",
    contractorNote: "Penambalan aspal darurat 4 cm.",
    photo: "/images/the-big-hole-in-ubud-s-main.jpg"
  },
  recurrenceIncident: {
    id: "TRG-2026-088",
    date: "28 Februari 2026 (106 hari kemudian)",
    status: "Indikasi Kerusakan Berulang (Terkonfirmasi)",
    diagnosis: "Tambalan darurat tergerus air karena ketiadaan perbaikan saluran rembesan di bawah aspal.",
    photo: "/images/ubud-jalan-raya-pothole-2009.jpg"
  },
  solution: "TERANG mencegah perbaikan sia-sia dengan mewajibkan verifikasi akar masalah sebelum pekerjaan ditutup secara administratif."
};
