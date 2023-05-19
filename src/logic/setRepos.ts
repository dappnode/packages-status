import {
  DNPRegistryEntry,
  PublicRegistryEntry,
  Registry,
} from "@dappnode/toolkit";
import { releaseFiles, Manifest } from "@dappnode/types";
import { clean } from "semver";
import { dnpRegistry, publicRegistry, reposit } from "./toolkit";
import { PackageRow } from "./types";
import { getGraphFieldName } from "./utils";

function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Promise timed out"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function setRepos(
  setRows: React.Dispatch<React.SetStateAction<PackageRow[]>>,
  setQuery: React.Dispatch<React.SetStateAction<string>>
): Promise<void> {
  const repos: {
    registry: Registry;
    _repos: DNPRegistryEntry[] | PublicRegistryEntry[];
  }[] = [
    { registry: "dnp", _repos: await dnpRegistry.queryGraphNewRepos() },
    {
      registry: "public",
      _repos: await publicRegistry.queryGraphNewRepos(),
    },
  ];

  let _query = "";
  try {
    for (const { registry, _repos } of repos) {
      await Promise.all(
        // eslint-disable-next-line no-loop-func
        _repos.map(async (_repo) => {
          return timeoutPromise(
            20 * 1000,
            (async () => {
              try {
                const { contentUri, version } =
                  await reposit.getVersionAndIpfsHash({
                    dnpName: `${_repo.name}.${registry}.dappnode.eth`,
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
                  if (split.length !== 2)
                    throw new Error("Invalid upstream repo");

                  _query += `
${getGraphFieldName(
  _repo.name,
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
                    name: _repo.name,
                    registry,
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
              }
            })()
          );
        })
      );
    }
  } catch (e) {
    console.log(e);
  } finally {
    setQuery(`{${_query}}`);
  }
}
