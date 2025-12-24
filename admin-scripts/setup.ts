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

// 1. Load Local .env (admin-scripts/.env)
dotenv.config();

// ⚠️ REPLACE WITH YOUR NEW PACKAGE ID IF NEEDED
const PACKAGE_ID = '0xc16397af90330b1549898ebeb7b3c7bbbab2beaa6e5b594aa8696fd0de8fd93b'; 
const TREASURY_ID = '0x95f8a9de71689f1bce56cfe9c3161f634ef89a612e255fe41a5003dfb20d3c0a';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// Sanitize the key
let RAW_KEY = process.env.SUI_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!RAW_KEY) { 
    console.error("❌ Missing SUI_PRIVATE_KEY in environment."); 
    process.exit(1); 
}
const PRIVATE_KEY = RAW_KEY.trim();

// Debug Key Length (Safety Check)
console.log(`🔑 Key found: ${PRIVATE_KEY.substring(0, 12)}... (Total Length: ${PRIVATE_KEY.length})`);
if (PRIVATE_KEY.startsWith('suiprivkey') && PRIVATE_KEY.length < 60) {
    console.warn("⚠️  WARNING: Your key seems too short for a Bech32 key. Check your .env file!");
}

// --- KEY HANDLING LOGIC ---
let keypair: Ed25519Keypair;
try {
    if (PRIVATE_KEY.startsWith('suiprivkey')) {
        // Handle Bech32 format
        const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        // Handle Base64 format
        keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY).slice(0, 32));
    }
} catch (e: any) {
    console.error("\n❌ Failed to parse Private Key.");
    if (e.message && e.message.includes("Data too short")) {
        console.error("👉 CAUSE: The key string in your .env file is truncated/incomplete.");
        console.error("👉 FIX: Re-export the private key from your wallet and paste the FULL string.");
    } else {
        console.error("Error details:", e.message);
    }
    process.exit(1);
}

const deployerAddress = keypair.getPublicKey().toSuiAddress();
console.log(`🚀 Running Setup with Account: ${deployerAddress}`);

async function main() {
  try {
    // --- STEP 1: CREATE EVENT ---
    console.log("\n1️⃣  Creating Event Machine & Config...");
    const tx = new TransactionBlock();
    
    // create_event(price, ctx)
    tx.moveCall({
      target: `${PACKAGE_ID}::event_manager::create_event`,
      arguments: [tx.pure(100000000)] // 0.1 SUI
    });

    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showObjectChanges: true }
    });

    // Find the objects
    const machineId = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('::TicketMachine'))?.objectId;
    const configId = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('::RewardConfig'))?.objectId;
    const capId = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('::OrganizerCap'))?.objectId;

    if (!machineId || !configId || !capId) {
        throw new Error("❌ Failed to find created objects. Check Package ID.");
    }
    console.log(`✅ Event Created! \n   Machine: ${machineId}\n   Config: ${configId}\n   Cap: ${capId}`);

    // --- STEP 2: SETUP REWARDS ---
    console.log("\n2️⃣  Setting up Rewards...");
    const txRewards = new TransactionBlock();
    
    // Reward 1
    txRewards.moveCall({
        target: `${PACKAGE_ID}::event_manager::update_reward_rule`,
        arguments: [
            txRewards.object(capId),
            txRewards.object(configId),
            txRewards.pure("Main Gate"),
            txRewards.pure("Early Bird Access"),
            txRewards.pure("https://api.dicebear.com/9.x/shapes/svg?seed=Gate&backgroundColor=2ecc71")
        ]
    });

    // Reward 2
    txRewards.moveCall({
        target: `${PACKAGE_ID}::event_manager::update_reward_rule`,
        arguments: [
            txRewards.object(capId),
            txRewards.object(configId),
            txRewards.pure("Merch Stand"),
            txRewards.pure("10% Off Discount"),
            txRewards.pure("https://api.dicebear.com/9.x/shapes/svg?seed=Merch&backgroundColor=3498db")
        ]
    });

    // Reward 3
    txRewards.moveCall({
        target: `${PACKAGE_ID}::event_manager::update_reward_rule`,
        arguments: [
            txRewards.object(capId),
            txRewards.object(configId),
            txRewards.pure("Tournament Champion"),
            txRewards.pure("Grand Prize Entry"),
            txRewards.pure("https://api.dicebear.com/9.x/shapes/svg?seed=Trophy&backgroundColor=f1c40f")
        ]
    });

    await client.signAndExecuteTransactionBlock({ signer: keypair, transactionBlock: txRewards });
    console.log("✅ Rewards Configured.");

    // --- STEP 3: CREATE SHARED BOOTHS ---
    const boothNames = ["Main Gate", "Merch Stand", "Tournament Champion"];
    console.log(`\n3️⃣  Creating ${boothNames.length} Shared Booths...`);
    
    const txBooths = new TransactionBlock();
    
    boothNames.forEach(name => {
      txBooths.moveCall({
        target: `${PACKAGE_ID}::event_manager::create_booth`,
        arguments: [ 
            txBooths.object(capId), 
            txBooths.pure(name),
            txBooths.pure(true)
        ]
      });
    });
    
    const resultBooths = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: txBooths,
        options: { showObjectChanges: true }
    });

    const createdBooths: { name: string, id: string }[] = [];
    let bIdx = 0;
    
    resultBooths.objectChanges?.forEach((o) => {
        // Look for '::Booth' (Shared Object)
        if (o.type === 'created' && o.objectType.includes('::Booth')) {
            if (bIdx < boothNames.length) {
                createdBooths.push({ name: boothNames[bIdx], id: o.objectId });
                bIdx++;
            }
        }
    });

    console.log(`✅ ${createdBooths.length} Booths Created & Shared`);

    // --- STEP 4: WRITE TO FRONTEND CONFIG ---
    const deploymentConfig = {
      NETWORK: "testnet",
      PACKAGE_ID: PACKAGE_ID,
      TEST_EVENT_ID: machineId,
      REWARD_CONFIG_ID: configId, 
      TREASURY_ID: TREASURY_ID,
      DEMO_BOOTH_ID: createdBooths.length > 0 ? createdBooths[0].id : "",
      ALL_BOOTHS: createdBooths
    };

    const frontendPath = path.resolve(__dirname, '../web/src/deployment.json');
    
    // Ensure directory exists
    const dir = path.dirname(frontendPath);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(frontendPath, JSON.stringify(deploymentConfig, null, 2));
    console.log(`\n📄 Config written to: ${frontendPath}`);
    console.log("👉 If your web app is running, it should update automatically.");

  } catch (e) {
    console.error("❌ Setup Failed:", e);
  }
}

main();
