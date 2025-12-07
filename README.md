# Scholarship Fullstack DApp

Struktur:
- Hardhat (root): compile + deploy smart contract
- backend/: API Node.js (Express) untuk baca/tulis ke contract
- frontend/: React + Vite DApp untuk mahasiswa

## 1. Setup Hardhat & Smart Contract

```bash
npm install
```

Buat file `.env` di root:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_RPC=https://polygon-mainnet.infura.io/v3/YOUR_KEY
ETHERSCAN_API=YOUR_ETHERSCAN_API_KEY
```

Lalu:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Simpan alamat `Scholarship deployed at: ...`.

## 2. Setup backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` backend:

```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY   # admin
SCHOLARSHIP_ADDRESS=0xAlamatDariStepDeploy
```

Lalu:

```bash
npm install
npm run dev
```

Backend berjalan di `http://localhost:4000`.

## 3. Setup frontend

```bash
cd frontend
npm install
```

Buat file `.env`:

```env
VITE_SCHOLARSHIP_ADDRESS=0xAlamatDariStepDeploy
```

Jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173` lalu connect MetaMask.
