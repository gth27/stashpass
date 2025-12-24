import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from '../config';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';

export function useAdmin() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // Check if user has OrganizerCap
    const { data: ownedObjects, isLoading } = useSuiClientQuery('getOwnedObjects', {
        owner: account?.address || '',
        filter: { StructType: `${CONFIG.PACKAGE_ID}::event_manager::OrganizerCap` }
    });

    const isOrganizer = !!ownedObjects?.data?.length;
    const organizerCapId = ownedObjects?.data?.[0]?.data?.objectId;

    // 1. UPDATE RULE
    const updateRule = (badgeName: string, perkDescription: string, imageUrl: string) => {
        if (!organizerCapId) return;
        const tx = new Transaction();
        tx.moveCall({
            target: `${CONFIG.PACKAGE_ID}::event_manager::update_reward_rule`,
            arguments: [
                tx.object(organizerCapId),
                tx.object(CONFIG.REWARD_CONFIG_ID),
                tx.pure.string(badgeName),
                tx.pure.string(perkDescription),
                tx.pure.string(imageUrl),
            ]
        });

        const toastId = toast.loading("Updating Perk Rule...");
        signAndExecute({ transaction: tx }, {
            onSuccess: () => toast.success("Perk Updated!", { id: toastId }),
            onError: (err) => toast.error("Failed: " + err.message, { id: toastId })
        });
    };

    // 2. CREATE BOOTH
    const createBooth = (name: string, recordAchievement: boolean) => {
        if (!organizerCapId) return; 
        const tx = new Transaction();
        
        tx.moveCall({
            target: `${CONFIG.PACKAGE_ID}::event_manager::create_booth`,
            arguments: [
                tx.object(organizerCapId),
                tx.pure.string(name),
                tx.pure.bool(recordAchievement)
            ]
        });

        const toastId = toast.loading("Creating Shared Booth...");
        
        signAndExecute({ transaction: tx }, {
            onSuccess: () => {
                toast.success("Booth Created & Shared!", { id: toastId });
            },
            onError: (err) => {
                console.error("Deploy Failed:", err);
                toast.error("Failed: " + err.message, { id: toastId });
            }
        });
    };

    // 3. WITHDRAW FUNDS (✅ IMPLEMENTED)
    const withdrawFunds = (onSuccess?: () => void) => {
        if (!organizerCapId) {
             toast.error("No Organizer Cap found");
             return;
        }

        const tx = new Transaction();
        
        // This calls the new function we added to the backend
        tx.moveCall({
            target: `${CONFIG.PACKAGE_ID}::event_manager::withdraw_funds`,
            arguments: [
                tx.object(organizerCapId),       // Authority
                tx.object(CONFIG.TEST_EVENT_ID)  // The TicketMachine ID (from config)
            ]
        });

        const toastId = toast.loading("Withdrawing all funds...");

        signAndExecute({ transaction: tx }, {
            onSuccess: () => {
                toast.success("💰 Cash Out Successful!", { id: toastId });
                if (onSuccess) onSuccess();
            },
            onError: (err) => {
                console.error("Withdraw Failed:", err);
                toast.error("Withdraw Failed: " + err.message, { id: toastId });
            }
        });
    };

    return {
        isOrganizer,
        isLoading,
        updateRule,
        createBooth,
        withdrawFunds
    };
}
