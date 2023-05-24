import { DappnodeRepository, type Registry } from "@dappnode/toolkit";
import { type ReleaseType, clean, diff, valid } from "semver";
import { graphql } from "@octokit/graphql";
import { type Manifest, releaseFiles, stakerPkgs } from "@dappnode/types";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

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

function getRegistry(repoName: string): Registry {
  if (repoName.includes("dnp")) return "dnp";
  else if (repoName.includes("public")) return "public";
  else throw new Error(`Unknown registry for repo ${repoName}`);
}

async function getUpdateStatus(
  rows: PackageRow[],
  query: string
): Promise<PackageRow[]> {
  const result = (await graphql({
    query: query,
    headers: {
      authorization: `token ${process.env.PABLO_TOKEN}`,
    },
  })) as any;

  return rows.map((row) => {
    const { registry, name } = row;
    // The dnpNames may contain dashes, which are not valid in GraphQL field names
    const latestUpstreamVersionFromGithub =
      result[getGraphFieldName(name, registry)]?.latestRelease?.tagName;

    if (!latestUpstreamVersionFromGithub)
      return {
        ...row,
        updateStatus: "NA" as ReleaseType,
        updateStatusError: "Latest upstream version not found in Github",
      };

    if (!row.pkgUpstreamVersion)
      return {
        ...row,
        updateStatus: "NA" as ReleaseType,
        updateStatusError: "Upstream version not found",
      };

    if (!valid(latestUpstreamVersionFromGithub))
      return {
        ...row,
        updateStatus: "NA" as ReleaseType,
        updateStatusError:
          "Error validating latest upstream version from Github",
      };

    if (!valid(row.pkgUpstreamVersion))
      return {
        ...row,
        updateStatus: "NA" as ReleaseType,
        updateStatusError:
          "Error validating latest upstream version from pkg Manifest file",
      };

    const cleanedVersion = clean(latestUpstreamVersionFromGithub);
    if (!cleanedVersion)
      return {
        ...row,
        updateStatus: "NA" as ReleaseType,
        updateStatusError: "Error cleaning latest upstream version from Github",
      };

    const updateStatus = diff(row.pkgUpstreamVersion, cleanedVersion);
    if (!updateStatus)
      return {
        ...row,
        updateStatus: "updated" as ReleaseType,
        upstreamVersion: cleanedVersion,
      };
    return { ...row, updateStatus, upstreamVersion: cleanedVersion };
  });
}

function sortPackagesByUpdateStatus(rows: PackageRow[]): PackageRow[] {
  const statusPriority = {
    major: 1,
    premajor: 2,
    minor: 3,
    preminor: 4,
    patch: 5,
    prepatch: 6,
    prerelease: 7,
    updated: 8,
    NA: 9,
    pending: 10,
  };

  return rows.sort((a, b) => {
    return statusPriority[a.updateStatus] - statusPriority[b.updateStatus];
  });
}

function getGraphFieldName(dnpName: string, registry: Registry): string {
  return `r${registry.replace(/-/g, "_")}${dnpName
    .split(".")[0]
    .replace(/-/g, "_")}`;
}

export async function getStakerPkgsStatus(): Promise<PackageRow[]> {
  let query = "";
  const pkgs: PackageRow[] = [];
  const reposit = new DappnodeRepository(
    "https://gateway.ipfs.dappnode.io",
    `https://mainnet.infura.io/v3/${process.env.MAINNET_INFURA_KEY}`,
    3 * 1000
  );

  await Promise.all(
    stakerPkgs.map(async (repo) => {
      try {
        const registry = getRegistry(repo);
        const { contentUri, version } = await reposit.getVersionAndIpfsHash({
          dnpName: repo,
        });
        const ipfsEntries = await reposit.list(contentUri);
        const manifestHash = ipfsEntries
          .find((entry) => releaseFiles.manifest.regex.test(entry.name))
          ?.cid.toString();

        if (!manifestHash) {
          console.log("Manifest not found. Skipping...");
          return;
        }

        const manifest = await reposit.getPkgAsset<Manifest>(
          releaseFiles.manifest,
          manifestHash
        );
        const {
          upstreamVersion = "",
          upstreamRepo = "",
          repository = {},
        } = manifest;

        if (upstreamRepo) {
          const split = upstreamRepo.split("/");
          const owner = split[0];
          const repoName = split[1];
          if (split.length !== 2) throw new Error("Invalid upstream repo");

          query += `
${getGraphFieldName(
  repo,
  registry
)}: repository(owner: "${owner}", name: "${repoName}") {
  latestRelease {
    tagName
  }
}
`;
        }

        const upstreamVersionCleaned = clean(upstreamVersion) || "";

        pkgs.push({
          name: repo,
          registry: registry,
          pkgVersion: version,
          contentUri,
          updateStatus: "pending",
          pkgUpstreamVersion: upstreamVersionCleaned,
          upstreamVersion: "",
          repoUrl: repository.url || "",
          upstreamRepoUrl: upstreamRepo,
        });
      } catch (e) {
        console.log(e);
      }
    })
  );
  return sortPackagesByUpdateStatus(await getUpdateStatus(pkgs, `{${query}}`));
}

export async function handler(event: HandlerEvent, context: HandlerContext) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET",
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(await getStakerPkgsStatus()),
  };
}
