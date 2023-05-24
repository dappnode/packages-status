import { type UpdateStatus } from "./types";

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
