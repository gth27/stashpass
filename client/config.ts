import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUI_PACKAGE_ID) {
    throw new Error("❌ MISSING SUI_PACKAGE_ID in .env");
}

export const CONFIG = {
    NETWORK: process.env.SUI_NETWORK || 'testnet',
    PACKAGE_ID: process.env.SUI_PACKAGE_ID,
    // The Protocol Treasury (Where your 1% fee goes)
    TREASURY_ID: process.env.SUI_PROTOCOL_TREASURY_ID, 
    // MACHINE_ID generate dynamically now!
    
    TYPES: {
        TICKET: `${process.env.SUI_PACKAGE_ID}::event_manager::Ticket`,
        BOOTH_CAP: `${process.env.SUI_PACKAGE_ID}::event_manager::BoothCap`,
        ORG_CAP: `${process.env.SUI_PACKAGE_ID}::event_manager::OrganizerCap`,
    }
};

export const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || '';
