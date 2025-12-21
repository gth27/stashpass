import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64, fromHEX } from '@mysten/sui.js/utils';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { CONFIG, PRIVATE_KEY } from './config.ts';

async function main() {
    console.log(`⚙️  Running Setup...`);

    // 1. Setup Client
    const client = new SuiClient({ url: getFullnodeUrl(CONFIG.NETWORK as any) });

    // --- UNIVERSAL KEY HANDLING ---
    let keypair;
    const cleanKey = PRIVATE_KEY.trim();

    try {
        if (cleanKey.startsWith('suiprivkey')) {
            // 1. Bech32 Mode (suiprivkey...)
            console.log("🔑 Detected 'suiprivkey' format...");
            const { schema, secretKey } = decodeSuiPrivateKey(cleanKey);
            if (schema !== 'ED25519') throw new Error(`Unsupported schema: ${schema}`);
            keypair = Ed25519Keypair.fromSecretKey(secretKey);
        
        } else if (cleanKey.startsWith('0x')) {
            // 2. Hex Mode (0x...)
            console.log("🔑 Detected Hex format (0x)...");
            keypair = Ed25519Keypair.fromSecretKey(fromHEX(cleanKey));
        
        } else {
            // 3. Base64 Mode (Standard)
            console.log("🔑 Detected Base64 format...");
            let rawBytes = fromB64(cleanKey);
            
            // --- FIX FOR 33-BYTE KEYS ---
            if (rawBytes.length === 33) {
                console.log("⚠️  Found 33-byte key (Flag byte detected). Slicing first byte...");
                rawBytes = rawBytes.slice(1); // Remove the first byte (flag)
            }

            keypair = Ed25519Keypair.fromSecretKey(rawBytes);
        }
    } catch (e) {
        console.error("\n❌ CRITICAL KEY ERROR:");
        console.error("Original Error:", e);
        return; 
    }

    const myAddress = keypair.toSuiAddress();
    console.log(`👤 Validated Identity: ${myAddress}`);
    console.log(`📦 Using Package: ${CONFIG.PACKAGE_ID}`);

    if (!CONFIG.TREASURY_ID) {
        throw new Error("❌ Missing TREASURY_ID in config/env.");
    }

    // --- STEP 1: CREATE THE EVENT (AS AN ORGANIZER) ---
    console.log("\n1️⃣  Creating a new Event...");
    
    const tx = new TransactionBlock();
    
    // Call create_event(price = 0.5 SUI)
    tx.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::create_event`,
        arguments: [ tx.pure(500_000_000) ] 
    });

    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showObjectChanges: true, showEffects: true }
    });

    if (result.effects?.status.status !== 'success') {
        console.error("❌ Failed to create event:", result.effects?.status.error);
        return;
    }

    // Find the new IDs
    const machineId = result.objectChanges?.find(
        (o) => o.type === 'created' && o.objectType.includes('::TicketMachine')
    )?.objectId;

    const orgCapId = result.objectChanges?.find(
        (o) => o.type === 'created' && o.objectType.includes('::OrganizerCap')
    )?.objectId;

    if (!machineId || !orgCapId) {
        console.error("❌ Could not find created objects. Check contract logic.");
        return;
    }

    console.log(`✅ Event Created!`);
    console.log(`   Machine ID: ${machineId}`);
    console.log(`   Org Cap ID: ${orgCapId}`);


    // --- STEP 2: BUY A TICKET (AS A USER) ---
    console.log("\n2️⃣  Buying a Ticket...");
    
    const tx2 = new TransactionBlock();
    const [payment] = tx2.splitCoins(tx2.gas, [tx2.pure(500_000_000)]);

    tx2.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::buy_ticket`,
        arguments: [
            tx2.object(machineId),         
            tx2.object(CONFIG.TREASURY_ID),
            payment                        
        ],
    });

    const buyResult = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx2,
        options: { showObjectChanges: true, showEffects: true }
    });

    const ticketId = buyResult.objectChanges?.find(
        (o) => o.type === 'created' && o.objectType.includes('::Ticket')
    )?.objectId;

    console.log(`✅ Ticket Purchased! ID: ${ticketId}`);


    // --- STEP 3: CREATE A BOOTH (AS THE ORGANIZER) ---
    console.log("\n3️⃣  Creating a Booth...");

    const tx3 = new TransactionBlock();
    tx3.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::create_booth`,
        arguments: [
            tx3.object(orgCapId), 
            tx3.pure("VIP Entrance")
        ]
    });

    const boothResult = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx3,
        options: { showObjectChanges: true }
    });

    const boothId = boothResult.objectChanges?.find(
        (o) => o.type === 'created' && o.objectType.includes('::BoothCap')
    )?.objectId;

    console.log(`✅ Booth Created! ID: ${boothId}`);

    // --- FINAL OUTPUT ---
    console.log("\n==================================================");
    console.log("🎉 SETUP COMPLETE. COPY THESE IDs:");
    console.log("==================================================");
    console.log(`👉 EVENT MACHINE ID: ${machineId}`);
    console.log(`👉 TICKET ID:        ${ticketId}`);
    console.log(`👉 BOOTH ID:         ${boothId}`);
    console.log("==================================================");
}

main();
