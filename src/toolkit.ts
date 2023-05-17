import { DappnodeRepository, DappNodeRegistry } from "@dappnode/toolkit";
import { ethers } from "ethers";
import { ipfsGateway } from "./params";

const infuraProvider = new ethers.InfuraProvider(
  "mainnet",
  "6b0526b37cc8457dba50026d69c47925"
);

export const repo = new DappnodeRepository(
  ipfsGateway,
  infuraProvider,
  3 * 1000
);

export const publicRegistry = new DappNodeRegistry(infuraProvider, "public");

export const dnpRegistry = new DappNodeRegistry(infuraProvider, "dnp");
