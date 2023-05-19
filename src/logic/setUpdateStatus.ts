import { graphql } from "@octokit/graphql";
import { valid, clean, diff, ReleaseType } from "semver";
import { PackageRow } from "./types";
import { getGraphFieldName } from "./utils";

export async function setUpdateStatus(
  rows: PackageRow[],
  setRows: React.Dispatch<React.SetStateAction<PackageRow[]>>,
  query: string
): Promise<void> {
  const result = (await graphql({
    query: query,
    headers: {
      authorization: "token " + process.env.PABLO_TOKEN,
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

  setRows(sortPackagesByUpdateStatus(newRows));
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
