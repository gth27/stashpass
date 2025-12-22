import { getFullnodeUrl } from "@mysten/sui.js/client";

export const CONFIG = {
  NETWORK: 'testnet',
  RPC_URL: getFullnodeUrl('testnet'),
  
  // Package ID
  PACKAGE_ID: '0xd847b4aa993d7e027ace4351f7467037313966156e499829e167e2ef1ae48da2',
  
  // Machine ID
  TEST_EVENT_ID: '0x34ebf78c94269680742bdd75b83ac04f37a2cfb78fa85fdd1ac49915eabe83f6',
  
  // Standard treasury
  TREASURY_ID: '0x95f8a9de71689f1bce56cfe9c3161f634ef89a612e255fe41a5003dfb20d3c0a' 
};



