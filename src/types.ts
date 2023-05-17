import { Registry } from "@dappnode/toolkit";
import { ReleaseType } from "semver";

export interface PackageRow {
  name: string;
  registry: Registry;
  pkgVersion: string;
  contentUri: string;
  updateStatus: ReleaseType | "updated" | "NA";
  pkgUpstreamVersion: string;
  repoUrl: string;
  upstreamRepoUrl: string;
}
