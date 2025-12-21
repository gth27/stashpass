import dotenv from 'dotenv';
dotenv.config();

// Fail loudly if variables are missing
if (!process.env.SUI_PACKAGE_ID) {
    throw new Error("❌ MISSING SUI_PACKAGE_ID in .env");
}

export const CONFIG = {
    NETWORK: process.env.SUI_NETWORK || 'testnet',
    PACKAGE_ID: process.env.SUI_PACKAGE_ID,
    MACHINE_ID: process.env.SUI_TICKET_MACHINE_ID,
    // Helper to build Move types dynamically
    TYPES: {
        TICKET: `${process.env.SUI_PACKAGE_ID}::event_manager::Ticket`,
        BOOTH_CAP: `${process.env.SUI_PACKAGE_ID}::event_manager::BoothCap`,
    }
};

export const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || '';
