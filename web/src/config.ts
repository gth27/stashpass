import { getFullnodeUrl } from "@mysten/sui/client";
import deployment from './deployment.json';

export const CONFIG = {
  NETWORK: deployment.NETWORK,
  RPC_URL: getFullnodeUrl(deployment.NETWORK as "testnet" | "mainnet"),
  PACKAGE_ID: deployment.PACKAGE_ID,
  TEST_EVENT_ID: deployment.TEST_EVENT_ID,
  
  REWARD_CONFIG_ID: (deployment as any).REWARD_CONFIG_ID, 
  
  TREASURY_ID: deployment.TREASURY_ID,
  DEMO_BOOTH_ID: deployment.DEMO_BOOTH_ID,
  TYPES: {
      BOOTH_CAP: `${deployment.PACKAGE_ID}::event_manager::BoothCap`
  }
};
