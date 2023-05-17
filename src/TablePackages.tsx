import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { dnpRegistry, publicRegistry, repo } from "./toolkit";
import { Registry } from "@dappnode/toolkit";
import { Manifest, releaseFiles } from "@dappnode/types";
import { ipfsGateway } from "./params";
import { Octokit } from "@octokit/rest";
import { eq, clean } from "semver";
import { setRepos } from "./setRepos";
import { PackageRow } from "./types";
import { setUpdateStatus } from "./setUpdateStatus";

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

export default function TablePackages() {
  const [rows, setRows] = React.useState<PackageRow[]>([]);
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState<any>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchRegistries() {
      try {
        setLoading(true);
        await setRepos(setRows, setQuery);
        setLoading(false);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) setError(error.message);
        else setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegistries();
  }, []);

  React.useEffect(() => {
    async function fetchUpdateStatus() {
      try {
        setLoading(true);
        await setUpdateStatus(rows, setRows, query);
        setLoading(false);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) setError(error.message);
        else setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchUpdateStatus();
  }, [query]);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell />
            <TableCell>Updated</TableCell>
            <TableCell>Registry</TableCell>
            <TableCell>Repo URL</TableCell>
            <TableCell>Upstream URL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length &&
            rows.map((row) => (
              <React.Fragment>
                <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
                  <TableCell>
                    <img
                      src={urlJoin(ipfsGateway, row.contentUri, "avatar.png")}
                      alt="logo"
                    />
                  </TableCell>
                  <TableCell>{`${row.name}:${row.pkgVersion}`}</TableCell>
                  <TableCell>{row.updateStatus}</TableCell>
                  <TableCell>{row.registry}</TableCell>
                  <TableCell>{row.repoUrl}</TableCell>
                  <TableCell>{row.upstreamRepoUrl}</TableCell>
                </TableRow>
              </React.Fragment>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
