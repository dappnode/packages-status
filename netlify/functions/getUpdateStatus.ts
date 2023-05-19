import { Registry } from "@dappnode/toolkit";
import { ReleaseType, clean, diff, valid } from "semver";
import { graphql } from "@octokit/graphql";

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

export async function getUpdateStatus(
  rows: PackageRow[],
  query: string
): Promise<PackageRow[]> {
  const result = (await graphql({
    query: query,
    headers: {
      authorization: `token ${process.env.PABLO_TOKEN}`,
    },
  })) as any;

  const newRows = rows.map((row) => {
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

  return sortPackagesByUpdateStatus(newRows);
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

export async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST",
  };

  if (event.httpMethod !== "POST") {
    // To enable CORS
    return {
      statusCode: 200, // <-- Important!
      headers,
      body: "This was not a POST request!",
    };
  }
  const requestBody = JSON.parse(event.body);
  const query = requestBody.query;
  if (!query) throw new Error("Missing query");
  if (typeof query !== "string") throw new Error("Invalid query");
  const rows = requestBody.rows;
  if (!rows) throw new Error("Missing rows");
  if (!Array.isArray(rows)) throw new Error("Invalid rows");
  if (rows.length === 0) throw new Error("Empty rows");
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(await getUpdateStatus(rows, query)),
  };
}
