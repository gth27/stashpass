import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { CONFIG } from './config.ts';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 1. Get Booth ID from deployment.json
const deploymentPath = path.resolve(__dirname, '../web/src/deployment.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
const BOOTH_ID = deployment.DEMO_BOOTH_ID; 

// 2. Ticket to Stamp
const TICKET_TO_SCAN = 'YOUR_TICKET_ID_HERE'; 

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    // Key Setup
    const cleanKey = (process.env.SUI_PRIVATE_KEY || '').trim();
    if (!cleanKey) throw new Error("Missing SUI_PRIVATE_KEY");
    
    let keypair;
    if (cleanKey.startsWith('suiprivkey')) {
        const { decodeSuiPrivateKey } = require('@mysten/sui.js/cryptography');
        const { secretKey } = decodeSuiPrivateKey(cleanKey);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        let raw = fromB64(cleanKey);
        if (raw.length === 33) raw = raw.slice(1);
        keypair = Ed25519Keypair.fromSecretKey(raw);
    }

    console.log(`🤖 Scanner: ${keypair.toSuiAddress()}`);
    console.log(`📍 Using Shared Booth: ${BOOTH_ID}`);

    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
        arguments: [
            tx.object(BOOTH_ID),   // Shared Object
            tx.object(TICKET_TO_SCAN)
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: { showEffects: true }
        });
        
        if (result.effects?.status.status === 'success') {
            console.log("✅ STAMPED! Digest:", result.digest);
        } else {
            console.error("❌ FAILED:", result.effects?.status.error);
        }
    } catch (e) {
        console.error("❌ Transaction Error:", e);
    }
}

main();
