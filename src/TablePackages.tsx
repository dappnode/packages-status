import * as React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { ipfsGateway } from "./params";
import { PackageRow } from "./types";
import { setUpdateStatus } from "./setUpdateStatus";
import {
  Link,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { updateStatusColorMap, urlJoin } from "./utils";

export default function TablePackages({
  rows,
  filteredRows,
  graphQuery,
  setRows,
  setError,
}: {
  rows: PackageRow[];
  filteredRows: PackageRow[];
  graphQuery: string;
  setRows: React.Dispatch<React.SetStateAction<PackageRow[]>>;
  setError: React.Dispatch<React.SetStateAction<any>>;
}) {
  React.useEffect(() => {
    async function fetchUpdateStatus() {
      try {
        await setUpdateStatus(rows, setRows, graphQuery);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) setError(error.message);
        else setError(error);
      }
    }

    fetchUpdateStatus();
    // Trigger only when graphQuery is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphQuery]);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell align="left" />
            <TableCell align="left" />
            <TableCell>
              <Typography variant="subtitle1">Updated</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1">Registry</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1">Repo URL</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1">Upstream URL</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRows.length > 0 &&
            filteredRows.map(
              (
                {
                  name,
                  updateStatus,
                  pkgVersion,
                  pkgUpstreamVersion,
                  upstreamVersion,
                  registry,
                  repoUrl,
                  upstreamRepoUrl,
                  contentUri,
                  updateStatusError,
                },
                index
              ) => (
                <React.Fragment>
                  <Tooltip title={updateStatusError || ""}>
                    <TableRow
                      sx={{
                        backgroundColor: updateStatusColorMap[updateStatus],
                        borderBottom:
                          index !== rows.length - 1 ? "1px solid gray" : "none",
                        "& > *": { borderBottom: "unset" },
                      }}
                    >
                      <TableCell>
                        <Box
                          component="img"
                          src={urlJoin(ipfsGateway, contentUri, "avatar.png")}
                          alt="logo"
                          sx={{
                            width: "30%",
                            height: "auto",
                            objectFit: "cover",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">{`${name}:${pkgVersion}`}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          {updateStatus === "pending" ? (
                            <CircularProgress />
                          ) : (
                            <>
                              {" "}
                              <Chip
                                icon={
                                  updateStatus === "patch" ||
                                  updateStatus === "minor" ? (
                                    <KeyboardArrowDownIcon />
                                  ) : updateStatus === "major" ? (
                                    <KeyboardDoubleArrowDownIcon />
                                  ) : updateStatus === "updated" ? (
                                    <DragHandleIcon />
                                  ) : (
                                    <></>
                                  )
                                }
                                label={updateStatus}
                              />{" "}
                              {`${pkgUpstreamVersion} - ${upstreamVersion}`}
                            </>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={registry}
                          color={registry === "dnp" ? "primary" : "secondary"}
                          sx={{
                            backgroundColor:
                              registry === "dnp" ? "#76cfb8" : "#a376cf",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={repoUrl.replace("git+", "")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconButton>
                            <LaunchIcon />
                          </IconButton>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`https://github.com/${upstreamRepoUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconButton>
                            <LaunchIcon />
                          </IconButton>
                        </Link>
                      </TableCell>
                    </TableRow>
                  </Tooltip>
                </React.Fragment>
              )
            )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
