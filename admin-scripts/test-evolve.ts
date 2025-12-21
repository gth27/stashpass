import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { CONFIG } from './config.ts'; 
import * as dotenv from 'dotenv';

dotenv.config();

// ⚠️ UPDATE THESE WITH YOUR NEW IDS FROM setup.ts
const TEST_TICKET_ID = '0xcff7db1c98481ef62691742e52233c70d720eaa1124d6bae7456220ad1f7d80e';
const BOOTH_ID = '0xe041ab6f43a5fb3a3151ab037ddeab8ca10304645d2af9cf52274a7198329e41';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSigner = () => {
    const privKey = process.env.SUI_PRIVATE_KEY;
    if (!privKey) throw new Error("Missing SUI_PRIVATE_KEY in .env");
    let secretKey = fromB64(privKey);
    if (secretKey.length === 33) secretKey = secretKey.slice(1);
    return Ed25519Keypair.fromSecretKey(secretKey);
};

const keypair = getSigner();
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function main() {
    console.log(`👤 User: ${keypair.toSuiAddress()}`);
    console.log(`🎫 Target Ticket: ${TEST_TICKET_ID}`);

    // --- STEP 1: STAMP THE TICKET ---
    console.log("\n1️⃣  Stamping Ticket (Staff Action)...");
    const tx1 = new TransactionBlock();
    tx1.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
        arguments: [
            tx1.object(BOOTH_ID),
            tx1.object(TEST_TICKET_ID),
            tx1.object('0x6') 
        ]
    });

    const res1 = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx1,
        options: { showEffects: true }
    });

    if (res1.effects?.status.status !== 'success') {
        console.error("❌ Stamping Failed:", res1.effects?.status.error);
        return;
    }
    console.log("✅ Ticket Stamped!");

    // 💤 WAIT FOR NETWORK TO UPDATE
    console.log("⏳ Waiting 5s for stamp to register...");
    await sleep(5000);

    // --- STEP 2: EVOLVE TO SOUVENIR ---
    console.log("\n2️⃣  Evolving to Souvenir (User Action)...");
    const tx2 = new TransactionBlock();
    tx2.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::evolve_to_souvenir`,
        arguments: [ tx2.object(TEST_TICKET_ID) ]
    });

    const res2 = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx2,
        options: { showObjectChanges: true, showEffects: true }
    });

    if (res2.effects?.status.status !== 'success') {
        console.error("❌ Evolution Failed:", res2.effects?.status.error);
        return;
    }

    const souvenirId = res2.objectChanges?.find((obj: any) => 
        (obj.type === 'created' || obj.type === 'mutated') && 
        obj.objectType?.includes('Souvenir')
    )?.objectId;

    if (!souvenirId) {
        console.error("❌ Could not find new Souvenir Object.");
        return;
    }
    console.log(`✨ Evolved! New Souvenir ID: ${souvenirId}`);

    // --- STEP 3: THE KIOSK VALIDATION (TRANSFER) ---
    console.log("\n3️⃣  TESTING MARKETPLACE READINESS (Transfer Test)...");
    
    // 💤 WAIT AGAIN JUST IN CASE
    await sleep(2000);

    const tx3 = new TransactionBlock();
    const DUMMY_RECIPIENT = "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    tx3.transferObjects([tx3.object(souvenirId)], tx3.pure(DUMMY_RECIPIENT));

    // ✅ FIXED: Explicitly set sender on the transaction object
    tx3.setSender(keypair.toSuiAddress());

    const dryRun = await client.dryRunTransactionBlock({
        transactionBlock: await tx3.build({ client: client })
    });

    if (dryRun.effects.status.status === 'success') {
        console.log("🟢 VALIDATION SUCCESS: The Souvenir IS tradeable!");
        console.log("   The blockchain accepted the transfer request.");
    } else {
        console.log("🔴 VALIDATION FAILED: The Souvenir is NOT tradeable.");
        console.log("   Reason:", dryRun.effects.status.error);
    }
}

main().catch(console.error);
