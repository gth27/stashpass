import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { CONFIG } from './config.ts'; 
import * as dotenv from 'dotenv';

dotenv.config();

// --- ⚠️ CONFIGURATION ⚠️ ---
// Paste the IDs from your setup.ts output here:
const EVENT_MACHINE_ID = '0x7f027b5a3eeb5536c069653188955adf6695be030e80f84511d1461e626ecf07';
const TICKET_TO_REFUND = '0x05543f219fe161b7b0fb7b479aa49923eea01a6a7288c66e4b267173a8d5334d';

// --- SETUP ---
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
    if (!EVENT_MACHINE_ID || !TICKET_TO_REFUND) {
        console.error("🛑 STOP: Please open 'test-refund.ts' and paste your Machine ID and Ticket ID at the top.");
        process.exit(1);
    }

    console.log(`👤 User: ${keypair.toSuiAddress()}`);
    console.log(`💸 Attempting to REFUND Ticket: ${TICKET_TO_REFUND}`);

    const tx = new TransactionBlock();

    // Call the refund_ticket function
    tx.moveCall({
        target: `${CONFIG.PACKAGE_ID}::event_manager::refund_ticket`,
        arguments: [
            tx.object(EVENT_MACHINE_ID), // The machine containing the funds
            tx.object(TICKET_TO_REFUND)  // The soulbound ticket to burn
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: { 
                showEffects: true,
                showBalanceChanges: true,
                showObjectChanges: true
            }
        });

        if (result.effects?.status.status === 'success') {
            console.log("\n✅ REFUND SUCCESSFUL!");
            console.log("-----------------------------------------");
            
            // Check for Object Deletion (The Ticket being burned)
            const deleted = result.objectChanges?.find(o => o.type === 'deleted');
            if (deleted) {
                console.log(`🔥 Ticket Burned: ${deleted.objectId}`);
            }

            // Check for Balance Change (Money returned)
            const balanceChange = result.balanceChanges?.find(b => 
                typeof b.owner === 'object' && 
                'AddressOwner' in b.owner && 
                b.owner.AddressOwner === keypair.toSuiAddress()
            );
            
            if (balanceChange) {
                console.log(`💰 Money Returned: +${Number(balanceChange.amount) / 1000000000} SUI`);
            } else {
                console.log("💰 Money Returned: (Check wallet for balance update)");
            }
            console.log("-----------------------------------------");

        } else {
            console.error("\n❌ REFUND FAILED.");
            console.error("Reason:", result.effects?.status.error);
        }

    } catch (e) {
        console.error("\n❌ Transaction Error:", e);
    }
}

main();
