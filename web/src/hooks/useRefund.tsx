import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from '../config';
import toast from 'react-hot-toast';

export function useRefund() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const refundTicket = (ticketId: string, onSuccess?: () => void) => {
    
    // 1. Define the actual transaction logic
    const executeRefund = () => {
        const toastId = toast.loading("Processing Refund...");
        const tx = new Transaction();
        
        tx.moveCall({
          target: `${CONFIG.PACKAGE_ID}::event_manager::refund_ticket`,
          arguments: [
            tx.object(CONFIG.TEST_EVENT_ID), 
            tx.object(ticketId)              
          ],
        });

        signAndExecute({ transaction: tx }, {
          onSuccess: () => {
            toast.success("💸 Refund Successful!", { id: toastId });
            if (onSuccess) onSuccess();
          },
          onError: (err) => {
            console.error(err);
            toast.error("❌ Refund Failed.", { id: toastId });
          }
        });
    };

    // 2. Trigger a Custom Toast for Confirmation
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div>
            <h3 className="font-bold text-gray-900">Confirm Refund?</h3>
            <p className="text-sm text-gray-600 mt-1">
                This will <span className="text-red-600 font-bold">burn</span> your ticket and return all of the value.
            </p>
        </div>
        
        <div className="flex gap-2 mt-2">
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => {
                    toast.dismiss(t.id);
                    executeRefund();
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold shadow-md shadow-red-500/30 transition-all active:scale-95"
            >
                Yes, Refund
            </button>
        </div>
      </div>
    ), {
        duration: Infinity, // Keeps toast open until user clicks a button
        position: 'top-center',
        style: {
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
            padding: '16px',
            border: '1px solid #f3f4f6'
        }
    });
  };

  return { refundTicket };
}
