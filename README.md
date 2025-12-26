

# StashPass – "Living Asset" Event Ticketing System on Sui


This repository contains the complete source code for the **StashPass** project:

1. **Smart Contract (Backend):** Written in Sui Move, utilizing the **Shared Objects** model to optimize scalability.
2. **Web Frontend:** A React/Vite application that connects wallets and serves Admins, Staff, and Users.
3. **Admin Scripts:** A suite of TypeScript tools for deployment, metadata setup, and rapid testing.

## Key Features

* **Soulbound Tickets:** Tickets are bound to the wallet (non-transferable/non-resellable), preventing black market scalping.
* **Dynamic Evolution:** Ticket metadata "evolves" in real-time as users participate in activities (scanning codes at Booths).
* **Shared Object Booths:** Ticket gates are shared objects, allowing thousands of users to check in simultaneously without network congestion.
* **Burn-to-Mint:** Burn completed tickets to exchange them for a **Souvenir NFT** (tradable) and receive exclusive perks.
* **Staff Dashboard:** Automatically syncs Booths from the blockchain without manual configuration.

---

## 1. Project Structure

* `contracts/`: Sui Move source code.
* `stashpass.move`: The main module managing events, tickets, and booths.


* `web/`: User Interface (React + Vite + dApp Kit).
* `admin-scripts/`: Tools for the Deployer/Admin.
* `setup.ts`: Initializes the Event, creates Booths, and **automatically writes the configuration file for the Frontend**.
* `setup-display.ts`: Configures NFT image rendering (Sui Object Display).
* `make-me-admin.ts`: Transfers Admin rights (OrganizerCap) to another wallet.
* `test-evolve.ts`, `test-refund.ts`: Scripts for testing business logic flows.



---

## 2. Installation & Deployment

### Step 1: Deploy Smart Contract (Backend)

Ensure you have the **Sui CLI** installed and have a SUI balance (Testnet).

```bash
cd contracts
sui client publish --gas-budget 100000000 --skip-dependency-verification

```

*After completion, copy the **Package ID** from the terminal.*

### Step 2: Configure Admin Scripts

```bash
cd ../admin-scripts
npm install

```

Create a `.env` file in the `admin-scripts/` folder and fill in the details:

```env
# Network
SUI_NETWORK=testnet

# 1. Package ID deployed in Step 1
SUI_PACKAGE_ID=0x... (Paste your ID here)

# 2. Private Key of the deployer wallet (to run setup scripts)
SUI_PRIVATE_KEY=suiprivkey... (or 0x...)

# 3. Treasury Address (receives 1% fee) - Can be your wallet address
SUI_PROTOCOL_TREASURY_ID=0x...

```

### Step 3: Run Initialization Script (Important)

This script will create the Event, create sample Booths, and **automatically generate the `deployment.json**` file for the Frontend.

```bash
npx ts-node setup.ts

```

*(Optional)* Configure NFT display visuals:

```bash
npx ts-node setup-display.ts

```

### Step 4: Launch Frontend (Web)

```bash
cd ../web
npm install
npm run dev

```

Access: `http://localhost:5173`

---

## 3. User Guide

### A. For Admin (Organizer)

1. Connect the Deployer wallet to the Web App.
2. Navigate to the `/admin` page.
3. **Create New Booth:** Enter booth name, select mode (Badge rewarding or Check-only). The Booth will appear immediately across the network (Shared Object).
4. **Configure Rewards:** Add redemption rules (e.g., Have "VIP" badge -> 50% Discount).
5. **Cash Out:** Withdraw ticket sales revenue to the wallet.

### B. For Staff (Staff Dashboard)

1. Navigate to the `/staff` page.
2. Connect any wallet (No special permissions needed as Booths are Shared Objects).
3. The system automatically loads the list of existing Booths.
4. Select a Booth to display the Check-in QR code.

### C. For Users (User Flow)

1. **Buy Ticket:** On the homepage, purchase a "General Admission" ticket.
2. **Check-in:** Go to "My Tickets", click the "Scan QR" button, and scan the code on the Staff's screen.
3. **Evolve:** Once enough badges are collected, click "Evolve" to burn the ticket and receive a Souvenir NFT.

---

## 4. Utility Scripts (CLI)

Aside from the Web UI, you can use the CLI for quick testing:

* **Transfer Admin Rights:**
```bash
npx ts-node admin-scripts/make-me-admin.ts <NEW_WALLET_ADDRESS>

```


* **Test Evolution Flow (Evolve) without UI:**
```bash
npx ts-node admin-scripts/test-evolve.ts

```


* **Test Refund Flow:**
```bash
npx ts-node admin-scripts/test-refund.ts

```



---

## 5. Security Notes

1. **Private Key:** Only use the Private Key in `admin-scripts/.env` to run setup commands. **The Frontend never requests a Private Key.**
2. **Git:** The `.env` file is included in `.gitignore`. Absolutely do not commit this file to GitHub.
3. **Network:** The project defaults to **Sui Testnet**. Ensure your wallet is on the correct network.
