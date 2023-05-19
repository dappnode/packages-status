import { DappnodeRepository, DappNodeRegistry } from "@dappnode/toolkit";
import { ethers } from "ethers";
import { ipfsGateway } from "./params";

const infuraProvider = new ethers.InfuraProvider(
  "mainnet",
  process.env.INFURA_MAINNET_KEY
);

export const reposit = new DappnodeRepository(
  ipfsGateway,
  infuraProvider,
  3 * 1000
);

export const publicRegistry = new DappNodeRegistry(infuraProvider, "public");

export const dnpRegistry = new DappNodeRegistry(infuraProvider, "dnp");
