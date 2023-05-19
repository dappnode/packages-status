import React from "react";
import TopBar from "./components/TopBar";
import TablePackages from "./components/TablePackages";
import { Box, CircularProgress, Container } from "@mui/material";
import Stats from "./components/Stats";
import { PackageRow } from "./logic/types";
import { Snackbar, Alert } from "@mui/material";

function App() {
  const [rows, setRows] = React.useState<PackageRow[]>([]);
  const [filteredRows, setFilteredRows] = React.useState<PackageRow[]>([]);
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
    async function fetchStakerPkgs() {
      try {
        setLoading(true);
        const reposnse = await fetch(
          "https://packages-status.netlify.app/.netlify/functions/getStakerPkgsStatus",
          {
            method: "GET",
          }
        );
        const data = await reposnse.json();
        if (!reposnse.ok) throw new Error(data.message);
        setRows(data);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) setError(error.message);
        else setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchStakerPkgs();
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
              <TablePackages rows={rows} filteredRows={filteredRows} />
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
