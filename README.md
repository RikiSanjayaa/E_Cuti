# Sistem Monitoring Izin Personel Polda NTB

Aplikasi internal (On-Premise) untuk mencatat dan memantau izin anggota kepolisian di Polda NTB. Sistem ini memungkinkan Operator (Admin) untuk mencatat laporan izin dan Atasan untuk memantau aktivitas personel melalui dashboard yang interaktif.

## Tech Stack

- **Backend**: Python (FastAPI), SQLAlchemy, SQLite
- **Frontend**: React.js, Vite, Tailwind CSS, Shadcn UI
- **Database**: SQLite (File-based)
- **Deployment**: On-Premise (Localhost)

## Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan komputer Anda sudah terinstall:

1.  **Python** (versi 3.9 ke atas)
2.  **Node.js** (versi 18 ke atas) & **npm**
3.  **Git**

## Panduan Instalasi (Installation)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal Anda.

### 1. Clone Repository (Jika dari GitHub)
```bash
git clone https://github.com/username/project-ini.git
cd project-ini
# Jika folder Anda bernama "E-cuti polda", sesuaikan.
```

### 2. Setup Backend (Server)

1.  Buka terminal/command prompt dan masuk ke folder proyek.
2.  **Membuat Virtual Environment (venv)**:
    Ini penting agar library Python terisolasi dan tidak mengganggu sistem komputer lain.
    ```bash
    # Windows
    python -m venv venv
    
    # Mac/Linux
    python3 -m venv venv
    ```

3.  **Mengaktifkan Virtual Environment**:
    ```bash
    # Windows (Command Prompt)
    .\venv\Scripts\activate
    
    # Windows (PowerShell)
    .\venv\Scripts\Activate.ps1
    
    # Mac/Linux
    source venv/bin/activate
    ```
    *Jika berhasil, akan muncul tanda `(venv)` di awal baris terminal Anda.*

4.  **Install Library Backend**:
    ```bash
    pip install -r backend/requirements.txt
    ```

5.  **Inisialisasi Database**:
    Jalankan perintah ini untuk membuat database dan user default (Admin & Atasan):
    ```bash
    python -m backend.init_db
    ```

6.  **Menjalankan Server Backend**:
    ```bash
    uvicorn backend.main:app --reload
    ```
    Server akan berjalan di `http://localhost:8000`. 
    *Biarkan terminal ini terbuka.*

### 3. Setup Frontend (Tampilan)

1.  Buka terminal **baru** (jangan tutup terminal backend).
2.  Masuk ke folder `frontend`:
    ```bash
    cd frontend
    ```

3.  **Install Library Frontend**:
    ```bash
    npm install
    ```

4.  **Menjalankan Frontend**:
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang muncul di terminal).
    Buka link tersebut di browser (Chrome/Edge).

## Cara Penggunaan

### Login
Gunakan akun default berikut untuk masuk:

*   **Admin / Operator**:
    *   Username: `admin`
    *   Password: `admin123`
    *   *Fitur: Input izin, upload bukti, kelola data personel.*

*   **Atasan / Pimpinan**:
    *   Username: `atasan`
    *   Password: `atasan123`
    *   *Fitur: Melihat dashboard statistik, grafik, dan download laporan (PDF/Excel).*

### Fitur Import Data
Jika ingin memasukkan data personel sekaligus:
1.  Login sebagai Admin.
2.  Klik tombol "Import Data".
3.  Upload file Excel (.xlsx) atau CSV dengan kolom minimal: `NRP`, `NAMA`, `PANGKAT`, `JABATAN`, `SATKER`.

---
**Catatan Keamanan**: 
Aplikasi ini menyimpan file upload di folder `uploads/` secara lokal. Pastikan folder tersebut memiliki izin baca/tulis.
