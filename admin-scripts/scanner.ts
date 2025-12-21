import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64, fromHEX } from '@mysten/sui.js/utils';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { CONFIG, PRIVATE_KEY } from './config.ts';

async function main() {
    // 1. Setup
    const client = new SuiClient({ url: getFullnodeUrl(CONFIG.NETWORK as any) });
    
    // --- UNIVERSAL KEY HANDLING (Fixes the 33-byte error) ---
    let keypair;
    const cleanKey = PRIVATE_KEY.trim();

    try {
        if (cleanKey.startsWith('suiprivkey')) {
            const { schema, secretKey } = decodeSuiPrivateKey(cleanKey);
            if (schema !== 'ED25519') throw new Error(`Unsupported schema: ${schema}`);
            keypair = Ed25519Keypair.fromSecretKey(secretKey);
        } else if (cleanKey.startsWith('0x')) {
            keypair = Ed25519Keypair.fromSecretKey(fromHEX(cleanKey));
        } else {
            let rawBytes = fromB64(cleanKey);
            // Fix for 33-byte keys (removes the flag byte)
            if (rawBytes.length === 33) {
                console.log("⚠️  Found 33-byte key. Slicing first byte...");
                rawBytes = rawBytes.slice(1);
            }
            keypair = Ed25519Keypair.fromSecretKey(rawBytes);
        }
    } catch (e) {
        console.error("❌ CRITICAL KEY ERROR:", e);
        return;
    }

    const myAddress = keypair.toSuiAddress();
    console.log(`🤖 Scanner Active: ${myAddress}`);

    // 2. DYNAMICALLY FIND THE BOOTH CAP
    // We ask the blockchain: "Does this address own a BoothCap?"
    const objects = await client.getOwnedObjects({
        owner: myAddress,
        filter: { StructType: CONFIG.TYPES.BOOTH_CAP },
        options: { showContent: true }
    });

    if (objects.data.length === 0) {
        console.error("❌ NO BOOTH CAP FOUND! This address is not authorized to scan.");
        console.error("   Did you run setup.ts? Did it create a BoothCap?");
        return;
    }

    const boothCapId = objects.data[0].data?.objectId;
    console.log(`✅ Authorized with BoothCap: ${boothCapId}`);

    // 3. THE SCAN (Simulation)
    // ⚠️ UPDATE THIS ID TO YOUR NEW TICKET ID FROM SETUP.TS OUTPUT
    const TICKET_TO_SCAN = '0x247fb5808d83ac3ab569d777fb5a9c1cc8f8eca457af503e96bf91b5f008e8fc'; 
    
    const CLOCK_OBJECT_ID = '0x6';

    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
        arguments: [
            tx.object(boothCapId!),   
            tx.object(TICKET_TO_SCAN), 
            tx.object(CLOCK_OBJECT_ID) 
        ],
    });

    // 4. Execute
    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: { showEffects: true }
        });
        
        if (result.effects?.status.status === 'success') {
            console.log("✅ STAMPED! Digest:", result.digest);
        } else {
            console.error("❌ FAILED (Logic Error):", result.effects?.status.error);
        }
    } catch (e) {
        console.error("❌ FAILED (Transaction Error):", e);
    }
}

main();
