import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { CONFIG } from './config.ts';
import * as dotenv from 'dotenv';

dotenv.config();

// Utility: Hàm chờ (Sleep) để tránh lỗi mạng chưa kịp index object
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- 1. SETUP KEYPAIR ---
const getSigner = () => {
    const privKey = process.env.SUI_PRIVATE_KEY;
    if (!privKey) throw new Error("Missing SUI_PRIVATE_KEY in .env");

    let secretKey = fromB64(privKey);
    if (secretKey.length === 33) {
        secretKey = secretKey.slice(1);
    }
    return Ed25519Keypair.fromSecretKey(secretKey);
};

const keypair = getSigner();
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function main() {
    console.log(`👤 Validated Identity: ${keypair.toSuiAddress()}`);
    console.log(`📦 Using Package: ${CONFIG.PACKAGE_ID}`);

    // --- STEP 1: CREATE EVENT ---
    console.log("\n1️⃣  Creating a new Event...");
    const tx1 = new TransactionBlock();
    const TICKET_PRICE = 100000000; // 1 SUI

    tx1.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::create_event`,
        arguments: [tx1.pure(TICKET_PRICE)],
    });

    const res1 = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx1,
        options: { showObjectChanges: true, showEffects: true }
    });

    if (res1.effects?.status.status !== 'success') {
        console.error("❌ Create Event Failed:", res1.effects?.status.error);
        return;
    }

    const machineId = res1.objectChanges?.find((obj: any) => 
        (obj.type === 'created' || obj.type === 'mutated') && 
        obj.objectType?.includes('TicketMachine')
    )?.objectId;

    const orgCapId = res1.objectChanges?.find((obj: any) => 
        (obj.type === 'created' || obj.type === 'mutated') && 
        obj.objectType?.includes('OrganizerCap')
    )?.objectId;

    if (!machineId || !orgCapId) {
        console.error("❌ Failed to find created objects. Dumping changes:");
        console.log(JSON.stringify(res1.objectChanges, null, 2));
        return;
    }

    console.log("✅ Event Created!");
    console.log(`   Machine ID: ${machineId}`);
    console.log(`   Org Cap ID: ${orgCapId}`);

    // 🕒 WAITING: Chờ 5 giây để mạng Testnet kịp nhận diện object mới
    console.log("⏳ Waiting 5s for network indexing...");
    await sleep(5000);

    // --- STEP 2: BUY TICKET ---
    console.log("\n2️⃣  Buying a Ticket...");
    const tx2 = new TransactionBlock();
    
    // Tách tiền lẻ để trả đúng giá vé
    const [payment] = tx2.splitCoins(tx2.gas, [tx2.pure(TICKET_PRICE)]);

    tx2.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::buy_ticket`,
        arguments: [
            tx2.object(machineId), // ID Máy bán vé
            payment // Tiền trả
        ],
    });

    const res2 = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx2,
        options: { showObjectChanges: true, showEffects: true }
    });

    if (res2.effects?.status.status !== 'success') {
        console.error("❌ Buy Ticket Failed:", res2.effects?.status.error);
        return;
    }

    const ticketId = res2.objectChanges?.find((obj: any) => 
        (obj.type === 'created' || obj.type === 'mutated') && 
        obj.objectType?.includes('Ticket') && 
        !obj.objectType?.includes('TicketMachine')
    )?.objectId;

    console.log("✅ Ticket Purchased!");
    console.log(`   Ticket ID: ${ticketId}`);

    // --- STEP 3: CREATE BOOTH ---
    console.log("\n3️⃣  Creating Booth (Badge)...");
    const tx3 = new TransactionBlock();
    const BOOTH_NAME = "VIP Gate";

    tx3.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::create_booth`,
        arguments: [
            tx3.object(orgCapId),
            tx3.pure(BOOTH_NAME)
        ],
    });

    const res3 = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx3,
        options: { showObjectChanges: true, showEffects: true }
    });

    const boothCapId = res3.objectChanges?.find((obj: any) => 
        (obj.type === 'created' || obj.type === 'mutated') && 
        obj.objectType?.includes('BoothCap')
    )?.objectId;

    console.log("✅ Booth Created!");
    console.log(`   Booth ID: ${boothCapId}`);

    console.log("\n🎉 SETUP COMPLETE!");
    console.log("-----------------------------------------");
    console.log("Gửi các ID này cho Frontend Teammate:");
    console.log(`EVENT_MACHINE_ID: '${machineId}'`);
    console.log(`TEST_TICKET_ID: '${ticketId}'`);
    console.log("-----------------------------------------");
}

main().catch(console.error);
