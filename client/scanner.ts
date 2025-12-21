import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { CONFIG, PRIVATE_KEY } from './config';

async function main() {
    // 1. Setup
    const client = new SuiClient({ url: getFullnodeUrl(CONFIG.NETWORK as any) });
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
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
        return;
    }

    const boothCapId = objects.data[0].data?.objectId;
    console.log(`✅ Authorized with BoothCap: ${boothCapId}`);

    // 3. THE SCAN (In real life, this ID comes from a QR Code)
    const TICKET_TO_SCAN = '0xa7a1f6e64512cecb9d9abe1a5a9d16572a0f0b6e5c094c939eb3fce22e974da3'; 
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
        console.log("✅ STAMPED! Digest:", result.digest);
    } catch (e) {
        console.error("❌ FAILED:", e);
    }
}

main();
