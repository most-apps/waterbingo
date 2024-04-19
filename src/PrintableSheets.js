import React from "react";
import { Box, Grid, Typography } from "@mui/material";

function generateRandomSheets(images, count) {
  let sheets = [];
  for (let i = 0; i < count; i++) {
    const shuffled = [...images].sort(() => 0.5 - Math.random());
    sheets.push(shuffled.slice(0, 25)); // get the first 25 for a 5x5 grid
  }
  return sheets;
}

function PrintableSheets() {
  const images = Array.from(
    { length: 27 },
    (_, i) => `/images/Slide${i + 1}.PNG`
  );
  const sheets = generateRandomSheets(images, 10); // generate 10 sheets

  return (
    <>
      {sheets.map((sheet, index) => (
        <Box
          key={index}
          sx={{ width: "100%", padding: 4, pageBreakAfter: "always" }}
        >
          <Typography
            variant="h4"
            sx={{ textAlign: "center", marginBottom: 3 }}
          >
            Water BINGO
          </Typography>
          <Grid container spacing={1}>
            {sheet.map((img, idx) => (
              <Grid item xs={2.4} key={idx} sx={{ border: "1px solid black" }}>
                <img
                  src={img}
                  alt={`Slide ${idx}`}
                  style={{ width: "100%", height: "auto" }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </>
  );
}

export default PrintableSheets;
