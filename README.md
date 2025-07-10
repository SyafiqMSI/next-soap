# CRUD SOAP Application


## Struktur Proyek

```
crud-soap/
├── app/                    # Next.js frontend
├── components/             # React components
├── server/                 # SOAP server
│   ├── config/            # Database configuration
│   ├── services/          # Business logic
│   ├── wsdl/              # SOAP WSDL files
│   └── server.js          # Main server file
├── package.json           # Dependencies untuk frontend & backend
└── .env                   # Environment variables (buat manual)
```

## Setup

1. **Install dependencies** (sekali saja untuk frontend & backend):
   ```bash
   npm install
   ```

2. **Setup database MySQL**:
   - Pastikan MySQL berjalan
   - Buat database `soap_db`
   - Buat file `.env` di root dengan konfigurasi:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=soap_db
   DB_PORT=3306
   PORT=9720
   ```

3. **Init database**:
    - Eksekusi ./server/init.sql


## Menjalankan Aplikasi

### Development Mode

**Jalankan frontend saja:**
```bash
npm run dev
```

**Jalankan backend saja:**
```bash
npm run server:dev
```

**Jalankan keduanya bersamaan:**
```bash
npm run dev:all
```

### Production Mode

**Build frontend:**
```bash
npm run build
npm start
```

**Jalankan backend:**
```bash
npm run server
```

## API Endpoints

### SOAP Service
- **Endpoint**: `http://localhost:9720/soap`
- **WSDL**: `http://localhost:9720/soap?wsdl`

## Docker

Jalankan dengan Docker Compose:
```bash
docker-compose up -d
```
