import { clean } from "semver";
import { reposit } from "./toolkit";
import { PackageRow } from "./types";
import { Manifest, releaseFiles, stakerPkgs } from "@dappnode/types";
import { getGraphFieldName, getRegistry } from "./utils";

export async function setStakerRepos(
  setRows: React.Dispatch<React.SetStateAction<PackageRow[]>>,
  setQuery: React.Dispatch<React.SetStateAction<string>>
) {
  let _query = "";

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

          _query += `
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

        setRows((rows) => [
          ...rows,
          {
            name: repo,
            registry: registry,
            pkgVersion: version,
            contentUri,
            updateStatus: "pending",
            pkgUpstreamVersion: upstreamVersionCleaned,
            upstreamVersion: "",
            repoUrl: repository.url || "",
            upstreamRepoUrl: upstreamRepo,
          },
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setQuery(`{${_query}}`);
      }
    })
  );
}
