import React from "react";
import TopBar from "./TopBar";
import TablePackages from "./TablePackages";
import { Box, CircularProgress, Container } from "@mui/material";
import Stats from "./Stats";
import { PackageRow } from "./types";
import { Snackbar, Alert } from "@mui/material";
import { setRepos } from "./setRepos";
import { setStakerRepos } from "./setStakerRepos";

function App() {
  const [rows, setRows] = React.useState<PackageRow[]>([]);
  const [filteredRows, setFilteredRows] = React.useState<PackageRow[]>([]);

  const [graphQuery, setGraphQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [open, setOpen] = React.useState(false);

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  React.useEffect(() => {
    async function fetchRegistries() {
      try {
        setLoading(true);
        //await setRepos(setRows, setGraphQuery);
        await setStakerRepos(setRows, setGraphQuery);
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
    setFilteredRows(rows);
  }, [rows]);

  return (
    <div className="App">
      <TopBar rows={rows} setFilteredRows={setFilteredRows} />

      {rows.length > 0 ? (
        <>
          <Container maxWidth="lg">
            <Box my={4}>
              <Stats rows={rows} />
            </Box>
          </Container>

          <Container maxWidth="lg">
            <Box my={4}>
              <TablePackages
                rows={rows}
                filteredRows={filteredRows}
                graphQuery={graphQuery}
                setRows={setRows}
                setError={setError}
              />
            </Box>
          </Container>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          {loading ? <CircularProgress /> : <p>No data</p>}
        </Box>
      )}

      <Snackbar open={open} autoHideDuration={6000} onClose={() => handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {error?.message || error}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
