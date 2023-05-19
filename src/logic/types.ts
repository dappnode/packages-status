import { Registry } from "@dappnode/toolkit";
import { ReleaseType } from "semver";

export type UpdateStatus = ReleaseType | "updated" | "NA" | "pending";
export interface PackageRow {
  name: string;
  registry: Registry;
  pkgVersion: string;
  contentUri: string;
  updateStatus: UpdateStatus;
  updateStatusError?: string;
  pkgUpstreamVersion: string;
  upstreamVersion: string;
  repoUrl: string;
  upstreamRepoUrl: string;
}
