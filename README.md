# Sistem Monitoring Izin Personel Polda NTB

Aplikasi internal (On-Premise) untuk mencatat dan memantau izin anggota kepolisian di Polda NTB. Sistem ini memungkinkan Operator (Admin) untuk mencatat laporan izin dan Atasan untuk memantau aktivitas personel melalui dashboard yang interaktif.

## Tech Stack

- **Backend**: Python (FastAPI), SQLAlchemy, SQLite
- **Frontend**: React.js, Vite, Tailwind CSS, Shadcn UI
- **Database**: SQLite (File-based)
- **Deployment**: On-Premise (Localhost)

## Quick Run (Centralized)

### Run Keduanya sekaligus (Backend & Frontend)
```bash
npm run dev
```

### Run Backend saja
```bash
npm run backend
# Custom port:
PORT=9000 npm run backend
```

### Run Frontend saja
```bash
npm run frontend
```

### Production Mode
```bash
npm run backend:prod
# Custom port:
PORT=9000 npm run backend:prod
```
---

## Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan komputer Anda sudah terinstall:

1.  **Python** (versi 3.9 ke atas)
2.  **Node.js** (versi 18 ke atas) & **npm**
3.  **Git**

## Panduan Instalasi (Installation)

### 1. Setup Backend (Server)

1.  **Membuat Virtual Environment (venv)**:
    ```bash
    python3 -m venv venv
    ```

2.  **Mengaktifkan Virtual Environment**:
    ```bash
    source venv/bin/activate
    ```

3.  **Install Library Backend**:
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Inisialisasi Database**:
    ```bash
    python -m backend.scripts.init_db
    ```
    *(Opsional)* Reset & Seed Ulang:
    ```bash
    python -m backend.scripts.refresh_db
    ```

5.  **Menjalankan Server Backend**:
    ```bash
    uvicorn backend.main:app --reload
    ```

### 2. Setup Frontend (Tampilan)

1.  Masuk ke folder `frontend`:
    ```bash
    cd frontend
    ```

2.  **Install Library Frontend**:
    ```bash
    npm install
    ```

3.  **Menjalankan Frontend**:
    ```bash
    npm run dev
    ```

## Cara Penggunaan

### Login
Gunakan akun default berikut untuk masuk:

*   **Admin / Operator**: `admin` / `admin123`
*   **Atasan / Pimpinan**: `atasan` / `atasan123`

---
**Catatan Keamanan**: 
Aplikasi ini menyimpan file upload di folder `uploads/` secara lokal.
