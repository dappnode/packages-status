import { Registry } from "@dappnode/toolkit";
import { UpdateStatus } from "./types";

export const updateStatusColorMap: Record<UpdateStatus | "other", string> = {
  updated: "lightgreen",
  patch: "lightyellow",
  minor: "lightsalmon",
  major: "lightcoral",
  NA: "lightgray",
  prerelease: "lightblue",
  premajor: "lightblue",
  preminor: "lightblue",
  prepatch: "lightblue",
  other: "lightgray",
  pending: "lightgray",
};

/**
 * Joins multiple url parts safely
 * - Does not break the protocol double slash //
 * - Cleans double slashes at any point
 * @param args ("http://ipfs.io", "ipfs", "Qm")
 * @return "http://ipfs.io/ipfs/Qm"
 */
export function urlJoin(...args: string[]): string {
  return args.join("/").replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Returns the GraphQL field name for a given repo
 * It must remove the dashes from the repo names
 */
export function getGraphFieldName(dnpName: string, registry: Registry): string {
  return `r${registry.replace(/-/g, "_")}${dnpName.replace(/-/g, "_")}`;
}
