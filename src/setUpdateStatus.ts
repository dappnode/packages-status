import { graphql } from "@octokit/graphql";
import { valid, clean, diff, ReleaseType } from "semver";
import { PackageRow } from "./types";

export async function setUpdateStatus(
  rows: PackageRow[],
  setRows: React.Dispatch<React.SetStateAction<PackageRow[]>>,
  query: string
): Promise<void> {
  const result = (await graphql({
    query: query,
    headers: {
      authorization: "token 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",
    },
  })) as any;

  console.log("result", result);

  const latestReleases: string[] = [];

  const newRows = rows.map((row) => {
    const { registry, name } = row;
    const fieldName = `r${registry.replace(/-/g, "_")}${name.replace(
      /-/g,
      "_"
    )}`;

    const version = result[fieldName]?.latestRelease?.tagName;

    if (row.pkgUpstreamVersion && version && valid(version)) {
      const cleanedVersion = clean(version);
      if (!cleanedVersion) {
        console.log("Invalid version", version);
        return row;
      }
      latestReleases.push(cleanedVersion);

      const updateStatus = diff(
        row.pkgUpstreamVersion,
        cleanedVersion
      ) as ReleaseType;
      if (updateStatus) return { ...row, updateStatus };
      else return { ...row, updateStatus: "updated" as ReleaseType };
    }
    return row;
  });

  setRows(newRows);
}
