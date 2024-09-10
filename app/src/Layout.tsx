import * as React from "react";
import { Box } from "@mui/material";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Box sx={{ my: 4 }}>
        {children}
      </Box>
    </div>
  );
}
