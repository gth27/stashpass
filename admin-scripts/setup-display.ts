import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64 } from '@mysten/sui.js/utils';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// 1. AUTO-DETECT PACKAGE ID
let PACKAGE_ID = '';
try {
    const deploymentPath = path.resolve(__dirname, '../web/src/deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    PACKAGE_ID = deployment.PACKAGE_ID;
} catch (e) {
    console.error("❌ Could not load deployment.json.");
    process.exit(1);
}

const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const PRIVATE_KEY = (process.env.SUI_PRIVATE_KEY || process.env.PRIVATE_KEY || '').trim();

if (!PRIVATE_KEY) { console.error("❌ Missing SUI_PRIVATE_KEY in .env"); process.exit(1); }

// Key Setup
let keypair;
try {
    if (PRIVATE_KEY.startsWith('suiprivkey')) {
        const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        let raw = fromB64(PRIVATE_KEY);
        if (raw.length === 33) raw = raw.slice(1);
        keypair = Ed25519Keypair.fromSecretKey(raw);
    }
} catch (e) {
    console.error("❌ Key Error:", e);
    process.exit(1);
}

const deployerAddress = keypair.getPublicKey().toSuiAddress();

async function main() {
    console.log(`🎨 Setting up Display for Package: ${PACKAGE_ID}`);

    // 2. Find the correct Publisher Object
    const owned = await client.getOwnedObjects({
        owner: deployerAddress,
        filter: { StructType: '0x2::package::Publisher' },
        options: { showContent: true }
    });
    
    // Strictly match Package ID to avoid using old Publishers
    const publisherObj = owned.data.find((o: any) => {
        const fields = o.data?.content?.fields;
        return fields?.module_name === 'event_manager' && fields?.package === PACKAGE_ID;
    });
    
    if(!publisherObj) {
        console.error(`❌ Publisher not found for package ${PACKAGE_ID}`);
        console.error("👉 Ensure your wallet is the one that deployed THIS specific package version.");
        return;
    }

    const publisherId = publisherObj.data?.objectId;
    console.log(`✅ Found Correct Publisher: ${publisherId}`);

    const tx = new TransactionBlock();

    // --- 3. Configure TICKET Display ---
    const ticketKeys = ['name', 'image_url', 'description', 'project_url', 'creator'];
    const ticketValues = [
        '{name}', 
        '{url}', 
        'Official StashPass Ticket. Scan at booth to verify.', 
        'https://stashpass.vercel.app',
        'StashPass Events'
    ];
    
    const [ticketDisplay] = tx.moveCall({
        target: '0x2::display::new_with_fields',
        arguments: [ tx.object(publisherId!), tx.pure(ticketKeys), tx.pure(ticketValues) ],
        typeArguments: [`${PACKAGE_ID}::event_manager::Ticket`]
    });

    tx.moveCall({
        target: '0x2::display::update_version',
        arguments: [ ticketDisplay ], 
        typeArguments: [`${PACKAGE_ID}::event_manager::Ticket`] 
    });

    tx.transferObjects([ticketDisplay], tx.pure(deployerAddress));


    // --- 4. Configure SOUVENIR Display ---
    const souvenirKeys = ['name', 'image_url', 'description', 'perks', 'creator'];
    const souvenirValues = [
        'StashPass Souvenir', 
        '{url}', 
        'Commemorative NFT for attending the event. Contains unlocked perks.', 
        '{perks}', 
        'StashPass Events'
    ];

    const [souvenirDisplay] = tx.moveCall({
        target: '0x2::display::new_with_fields',
        arguments: [ tx.object(publisherId!), tx.pure(souvenirKeys), tx.pure(souvenirValues) ],
        typeArguments: [`${PACKAGE_ID}::event_manager::Souvenir`]
    });

    tx.moveCall({
        target: '0x2::display::update_version',
        arguments: [ souvenirDisplay ],
        typeArguments: [`${PACKAGE_ID}::event_manager::Souvenir`]
    });

    tx.transferObjects([souvenirDisplay], tx.pure(deployerAddress));

    // --- Execute ---
    console.log("🚀 Sending Transaction...");
    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showEffects: true }
    });
    
    if (result.effects?.status.status === 'success') {
        console.log("✅ Display Updated Successfully!");
    } else {
        console.error("❌ Failed:", result.effects?.status.error);
    }
}

main();
