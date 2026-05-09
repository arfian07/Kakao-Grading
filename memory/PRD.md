# PRD — Sistem Grading Biji Kakao IoT Dashboard

## Original Problem Statement
Dashboard web instrument monitoring untuk sistem klasifikasi mutu dan estimasi harga biji kakao berbasis IoT. Ditampilkan pada layar sentuh 7 inch Raspberry Pi (resolusi 800×480), Dark Mode default, modern industrial dashboard, touch-friendly. Stack: React frontend mockup, theme dari `tema.md`.

## User Choices (locked)
- Mockup UI saja (no backend)
- Login dummy
- Simulasi sensor (random/dummy)
- Image analysis & fuzzy = mockup random

## Personas
- **Operator stasiun** — input pengukuran, capture citra, simpan transaksi
- **Supervisor / Administrator** — atur harga referensi, lihat riwayat

## Architecture
- Frontend: React 19 + Tailwind + Shadcn UI primitives
- State: Context API + localStorage (`kakao_user`, `kakao_prices`, `kakao_trx`)
- Routing: react-router-dom v7 (`/login`, `/`, `/history`, `/settings`)
- Theme: HSL CSS variables sesuai `tema.md` (dark default), font Lexend + JetBrains Mono
- Layout: fixed `device-frame` 800×480px centered

## What's Implemented (Feb 9, 2026)
- ✅ Theme `tema.md` (Primary #949ce5, Secondary #7f1f21, Accent #d19f44, dark mode default)
- ✅ Topbar 3-section: Brand (kiri) | Tab Nav Dashboard/Riwayat/Harga (tengah) | Status ESP32+MQTT + Clock + TRX ID + User Logout (kanan)
- ✅ Login page: Tab Masuk/Daftar, password eye toggle (login & register), no status indicators (clean)
- ✅ Dashboard: Live camera preview + HUD (REC/FPS) + scanline overlay, tombol Aktifkan/Capture/Upload, 4 stat citra (Total/Berjamur/Hitam/Cacat), Card Berat realtime + Tare/Mulai/Kunci, Card Bean Count /100g, Card Fuzzy (Grade + nilai + estimasi harga IDR)
- ✅ Bottom action bar: Analisis Citra · Analisis Kualitas · Simpan Transaksi · Reset Sistem
- ✅ History page: stats strip + search + filter grade + tabel touch-friendly + modal detail dengan gambar
- ✅ Settings page: 3 input harga Mutu I/II/III dengan ikon distinct, indikator selisih, Save (disabled saat clean) + Reset Default
- ✅ Toast notifications via sonner
- ✅ Login persistence via localStorage
- ✅ 100% frontend test pass rate (16/16 acceptance criteria)

## Test Credentials
- Username: `admin` · Password: `admin123` (dummy localStorage)

## Backlog / Next Phase
### P0 (siap kalau diminta)
- Integrasi backend FastAPI + MongoDB untuk transaksi & user real
- Auth proper (JWT atau Emergent Google Auth)

### P1
- Integrasi MQTT broker untuk feed sensor real-time dari ESP32
- WebSocket untuk push update berat live tanpa polling
- Endpoint capture kamera (Pi camera v2/v3 via REST)
- AI vision (GPT-4o vision atau model on-device) untuk image analysis nyata

### P2
- Export laporan PDF/CSV transaksi
- Dashboard analytics (grafik harian/mingguan)
- Multi-user role permissions
- Audit log
- Cetak struk via printer thermal

## File Structure
```
/app/frontend/src/
├── App.js                          # Routing + Toaster
├── index.css                       # Theme variables (tema.md → HSL)
├── lib/mockData.js                 # Sample transactions, helpers
├── context/AppContext.jsx          # Auth + state via localStorage
├── components/
│   ├── Layout.jsx                  # device-frame wrapper + topbar
│   └── Topbar.jsx                  # 3-section topbar
└── pages/
    ├── Login.jsx                   # Tab Masuk/Daftar + eye toggle
    ├── Dashboard.jsx               # Camera + sensors + fuzzy
    ├── History.jsx                 # Transactions table
    └── Settings.jsx                # Price settings
```
