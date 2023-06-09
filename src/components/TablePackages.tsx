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
import { PackageRow } from "../logic/types";
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
import { updateStatusColorMap, urlJoin } from "../logic/utils";

export default function TablePackages({
  rows,
  filteredRows,
}: {
  rows: PackageRow[];
  filteredRows: PackageRow[];
}) {
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
              <Typography variant="subtitle1">Repo</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1">Upstream</Typography>
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
                          src={urlJoin(
                            "https://gateway.ipfs.dappnode.io",
                            contentUri,
                            "avatar.png"
                          )}
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
