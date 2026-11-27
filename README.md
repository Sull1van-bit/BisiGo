# BisiGo: Mulai Berbicara Tanpa Suara

Repositori resmi aplikasi web BisiGo untuk HORIZON 2026 Web Development Competition.

## 1. Judul Proyek
**BisiGo**
Tagline: *Mulai berbicara tanpa suara.* (EN: *Start speaking without a sound.*)

## 2. Latar Belakang Pembuatan
Bahasa Isyarat Indonesia (BISINDO) merupakan media komunikasi alami utama bagi komunitas Tuli di Indonesia. Meskipun demikian, akses masyarakat umum untuk mempelajari BISINDO masih sangat terbatas. Sebagian besar materi pembelajaran yang tersedia saat ini bersifat pasif berupa poster statis atau video satu arah tanpa adanya sistem umpan balik terhadap gerakan tangan pengguna.

Ketiadaan verifikasi interaktif ini sering kali membuat pemula ragu apakah orientasi jari, bentuk telapak tangan, atau arah gerakannya sudah benar. BisiGo dibangun untuk menjembatani kesenjangan tersebut melalui platform web gamifikasi yang menggabungkan panduan visual bertahap dengan verifikasi kamera waktu nyata menggunakan model kecerdasan buatan.

## 3. Tujuan Dibuatnya Website
BisiGo dirancang untuk mendukung pencapaian Tujuan Pembangunan Berkelanjutan (SDG 4: Quality Education) dengan fokus pada pendidikan inklusif melalui beberapa pilar:
1. Menurunkan hambatan masuk belajar bahasa isyarat melalui akses peramban langsung tanpa instalasi perangkat lunak tambahan.
2. Memfasilitasi pembentukan memori otot melalui alur pembelajaran aktif: melihat panduan, menjawab kuis konteks, dan mempraktikkannya langsung di depan kamera.
3. Menumbuhkan kesadaran dan kemampuan berkomunikasi inklusif di lingkungan keluarga, sekolah, dan tempat kerja.

## 4. Penjelasan Fitur Website

### A. Mode Tamu dan Migrasi Akun (Guest Mode & Account Migration)
Pengguna atau dewan juri dapat langsung memulai pembelajaran tanpa proses registrasi. Seluruh kemajuan belajar (level terbuka, streak harian, dan XP) tersimpan di penyimpanan lokal peramban. Saat pengguna memutuskan untuk mendaftar akun, seluruh riwayat belajar dari sesi tamu dimigrasikan secara otomatis.

### B. Antarmuka Bilingual (ID / EN)
Antarmuka mendukung pergantian bahasa instan antara Bahasa Indonesia dan Bahasa Inggris. Materi yang diajarkan tetap berfokus pada kosakata BISINDO. Dalam mode Bahasa Inggris, label isyarat disajikan dengan format nama BISINDO beserta terjemahannya, misalnya "Makan (Eat)" atau "Minum (Drink)".

### C. Jalur Belajar Taktil (Stepping-Stone Path)
Jalur belajar terstruktur yang terbagi menjadi Unit 1 (Keseharian di rumah) dan Unit 2 (Kegiatan dan perasaan). Level disajikan dalam simpul melingkar dengan tata letak kurva S:
- Simpul terbuka mengarahkan pengguna ke sesi latihan tiga tahap.
- Simpul terkunci memberikan umpan balik getar saat diklik beserta petunjuk penyelesaian level sebelumnya.
- Simpul yang telah tuntas ditandai dengan warna kuning hangat (mastery).

### D. Alur Latihan Tiga Tahap per Isyarat
1. **Kartu Telaah Isyarat**: Penjelasan posisi tangan, arah gerak, diagram ilustrasi vektor, dan konteks situasi nyata.
2. **Kuis Konteks Taktil**: Pertanyaan skenario situasional dengan empat tombol pilihan jawaban berumpan balik instan.
3. **Praktik Kamera Langsung**: Kamera web menangkap gerakan pengguna dan sistem visi kecerdasan buatan mencocokkannya dengan kosakata BISINDO secara instan.

### E. Kamus 21 Isyarat BISINDO
Pusat referensi mandiri yang memuat seluruh 21 kosakata isyarat:
- Pencarian teks instan berdasarkan kata kunci, arti, maupun gerakan.
- Filter berdasarkan unit kurikulum.
- State kosong yang informatif ketika kata kunci pencarian tidak ditemukan.
- Dialog detail yang menampilkan deskripsi lengkap dan pintasan latihan.

### F. Pengaturan dan Pengelolaan Data
Halaman pengaturan terpusat untuk mengganti bahasa, memeriksa status sistem deteksi AI, mereset progres belajar, dan keluar dari sesi.

## 5. Tech Stack dan Privasi Pengguna

### Teknologi yang Digunakan
- **Frontend Framework**: React 19 dengan TypeScript dan Vite 6.
- **Routing**: React Router DOM v7 dengan pemisahan bundel berbasis rute (code-splitting) untuk skor performa tinggi.
- **Styling**: Tailwind CSS dengan sistem desain taktil solid tanpa efek transparansi berlebih atau gradien acak.
- **Ikon**: Phosphor Icons (@phosphor-icons/react) dengan bobot tebal (bold) untuk navigasi dan isi (fill) untuk penanda status aktif.
- **Animasi Interaktif**: Framer Motion untuk transisi status terpicu (triggered interaction only, tanpa animasi berulang tak berujung).
- **Computer Vision**: Model deteksi kecerdasan buatan yang sudah terpasang dan terkonfigurasi secara bawaan untuk mengenali 21 isyarat tangan BISINDO.

### Privasi dan Keamanan Pengguna
BisiGo menghormati privasi pengguna secara ketat:
1. Aliran kamera web hanya diaktifkan saat pengguna berada pada tahap latihan kamera dan indikator visual kamera aktif menyala.
2. Frame video diproses secara langsung (ephemeral) untuk inferensi model dan tidak pernah disimpan ke server permanen maupun database.
3. Seluruh data kemajuan belajar dan preferensi disimpan secara lokal di peramban pengguna (localStorage).

## 6. Daftar 21 Isyarat BISINDO Terintegrasi

| No | Kosakata BISINDO | Terjemahan Inggris | Unit | Kategori Gerakan |
|:---|:---|:---|:---|:---|
| 1 | Saya | I / Me | Unit 1 | Saya |
| 2 | Makan | Eat | Unit 1 | Makan |
| 3 | Minum | Drink | Unit 1 | Minum |
| 4 | Tidur | Sleep | Unit 1 | Tidur |
| 5 | Mandi | Bathe | Unit 1 | Mandi |
| 6 | Duduk | Sit | Unit 1 | Duduk |
| 7 | Berjalan | Walk | Unit 1 | Berjalan |
| 8 | Berhenti | Stop | Unit 1 | berhenti |
| 9 | Melihat | See / Look | Unit 1 | Melihat |
| 10 | Bicara | Speak | Unit 1 | Bicara |
| 11 | Membaca | Read | Unit 2 | Membaca |
| 12 | Berpikir | Think | Unit 2 | Berpikir |
| 13 | Berdoa | Pray | Unit 2 | Berdoa |
| 14 | Bermain | Play | Unit 2 | Bermain |
| 15 | Membuat | Make | Unit 2 | Membuat |
| 16 | Menggambar | Draw | Unit 2 | Menggambar |
| 17 | Menuangkan | Pour | Unit 2 | Menuangkan |
| 18 | Mendorong | Push | Unit 2 | Mendorong |
| 19 | Memeluk | Hug | Unit 2 | Memeluk |
| 20 | Memukul | Hit | Unit 2 | Memukul |
| 21 | Menangis | Cry | Unit 2 | Menangis |

## 7. Panduan Penggunaan dan Pengujian

### Prasyarat Lingkungan
- Node.js versi 18 atau lebih baru.
- npm versi 9 atau lebih baru.

### Langkah Menjalankan Aplikasi
1. Buka terminal di direktori proyek:
   ```bash
   cd /path/to/BisiGo
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka tautan lokal yang ditampilkan (biasanya `http://localhost:3000` atau `http://localhost:5173`).

### Langkah Melakukan Build Produksi
Untuk memastikan tidak ada kesalahan kompilasi dan bundel teroptimasi:
```bash
npm run build
```

### Panduan Pengujian untuk Dewan Juri
1. **Menguji Tanpa Registrasi**: Klik tombol "Mulai Belajar (Mode Tamu)" di halaman beranda. Anda akan langsung diarahkan ke Jalur Belajar.
2. **Menguji Sesi Latihan**: Klik simpul Level 1.1 ("Makan dan minum"). Anda akan melalui tahap telaah visual, kuis konteks, dan praktik kamera langsung.
3. **Praktik Kamera Siap Pakai**: Sistem deteksi visi kecerdasan buatan telah terkonfigurasi secara bawaan dan siap digunakan secara langsung. Ketika webcam aktif dan Anda memperagakan isyarat tangan, sistem secara otomatis mendeteksi gerakan Anda.
4. **Opsi Pengujian Tambahan**: Pada tahap kamera, tersedia juga tombol "Simulasikan Gerakan Benar" untuk pengujian verifikasi instan satu klik, serta tombol "Tidak Bisa Pakai Kamera" jika perangkat peramban tidak memiliki akses webcam.
