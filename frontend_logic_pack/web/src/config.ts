import { getFullnodeUrl } from "@mysten/sui.js/client";

export const CONFIG = {
  NETWORK: 'testnet',
  RPC_URL: getFullnodeUrl('testnet'),
  
  // REPLACE with your actual Package ID
  PACKAGE_ID: '0xd847b4aa993d7e027ace4351f7467037313966156e499829e167e2ef1ae48da2',
  
  // REPLACE with the "EVENT_MACHINE_ID" from your setup.ts output
  // This is the default event users will buy tickets for
  TEST_EVENT_ID: '0x7f027b5a3eeb5536c069653188955adf6695be030e80f84511d1461e626ecf07',
  
  // Treasury (Optional, usually 0x0... on Testnet is fine for splits)
  TREASURY_ID: '0x0000000000000000000000000000000000000000000000000000000000000000' 
};
