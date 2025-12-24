import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64 } from '@mysten/sui.js/utils';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from local folder
dotenv.config();

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// 1. Get arguments
const targetAddress = process.argv[2];
if (!targetAddress || !targetAddress.startsWith('0x')) {
    console.error("❌ Usage: npx ts-node make-me-admin.ts <TARGET_ADDRESS>");
    process.exit(1);
}

// 2. Load Package ID from deployment.json (to ensure it matches the latest setup)
let PACKAGE_ID = process.env.SUI_PACKAGE_ID;
try {
    const deploymentPath = path.resolve(__dirname, '../web/src/deployment.json');
    if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        PACKAGE_ID = deployment.PACKAGE_ID;
        console.log(`📦 Using Package ID from deployment.json: ${PACKAGE_ID}`);
    }
} catch (e) {
    console.log("⚠️ Could not read deployment.json, falling back to .env");
}

if (!PACKAGE_ID) {
    console.error("❌ No Package ID found in .env or deployment.json");
    process.exit(1);
}

// 3. Load and Parse Key
const RAW_KEY = process.env.SUI_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!RAW_KEY) { 
    console.error("❌ Missing SUI_PRIVATE_KEY in .env"); 
    process.exit(1); 
}
const PRIVATE_KEY = RAW_KEY.trim();

let keypair: Ed25519Keypair;
try {
    if (PRIVATE_KEY.startsWith('suiprivkey')) {
        const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY).slice(0, 32));
    }
} catch (e: any) {
    console.error("❌ Failed to parse Private Key:", e.message);
    process.exit(1);
}

const currentAddress = keypair.getPublicKey().toSuiAddress();

async function main() {
    console.log(`🔍 Checking for OrganizerCap owned by: ${currentAddress}`);

    try {
        // 4. Find the OrganizerCap using the correct Package ID
        const ownedObjects = await client.getOwnedObjects({
            owner: currentAddress,
            filter: { StructType: `${PACKAGE_ID}::event_manager::OrganizerCap` }
        });

        const cap = ownedObjects.data?.[0];
        if (!cap || !cap.data) {
            console.error(`❌ No OrganizerCap found for package ${PACKAGE_ID}`);
            console.error("👉 If you recently published a new contract, make sure the ID in deployment.json is correct.");
            return;
        }

        const capId = cap.data.objectId;
        console.log(`✅ Found OrganizerCap: ${capId}`);
        console.log(`🚀 Transferring to: ${targetAddress}...`);

        // 5. Execute Transfer
        const tx = new TransactionBlock();
        tx.transferObjects([tx.object(capId)], tx.pure(targetAddress));

        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: { showEffects: true }
        });

        if (result.effects?.status.status === 'success') {
            console.log("✨ SUCCESS! The OrganizerCap has been transferred.");
            console.log(`🔗 View on Explorer: https://suiscan.xyz/testnet/tx/${result.digest}`);
        } else {
            console.error("❌ Transfer failed:", result.effects?.status.error);
        }

    } catch (e: any) {
        console.error("❌ Error during transfer:", e.message || e);
    }
}

main();
