// app/components/Header.tsx
import React from "react";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Button, Avatar } from "@mui/material";
import { auth } from "@/lib/auth";

const Header = async () => {
  const session = await auth();

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Button color="inherit" component={Link} href="/" sx={{ flexGrow: 1, justifyContent: "flex-start" }}>
          <Typography variant="h6" component="div" >
            GradeUFOP
          </Typography>
        </Button>

        {session?.user && (
          <Button color="inherit" component={Link} href="/profile">
            <Avatar sx={{ width: 32, height: 32, mr: 1 }} alt={session.user.name || ""} src={session.user.image || ""} />
            {session.user.email}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
