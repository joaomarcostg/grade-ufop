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
        <div className="flex-1">
          <Button color="inherit" component={Link} href="/">
            <Typography variant="h6" component="div">
              GradeUFOP
            </Typography>
          </Button>
        </div>

        {session?.user && (
          <Button
            color="inherit"
            component={Link}
            href="/profile"
            sx={{ gap: 1 }}
          >
            <Avatar
              sx={{ width: 32, height: 32 }}
              alt={session.user.name || ""}
              src={session.user.image || ""}
            />
            <span className="hidden md:flex">{session.user.email}</span>
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
