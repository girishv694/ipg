import {
  ActionFunction,
  createCookieSessionStorage,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { prisma } from "../db.server";
import { Button, TextField, Typography } from "@mui/material";

interface User {
  id: string;
  username: string;
  password: string
}

interface ActionData {
  error?: string;
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || typeof password !== "string") {
    return json<ActionData>({ error: "Invalid form submission" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return json<ActionData>({ error: "User not found" }, { status: 404 });
  }

  if (user.password !== password) {
    return json<ActionData>({ error: "Invalid password" }, { status: 401 });
  }

  const session = await sessionStorage.getSession();
  session.set("userId", user.id);
  session.set("userName", user.username);
  return redirect("/home", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};

const Login = () => {
  const actionData = useActionData<ActionData>();

  return (
    <div className="w-1/3 m-auto shadow-2xl my-10 p-6">
      <Form
        method="post"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
        }}
      >
        <h1 className="text-center text-3xl font-bold">Login</h1>

        <TextField
          name="username"
          label="Username"
          variant="outlined"
          fullWidth
          required
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          required
        />

        {actionData?.error && (
          <Typography color="error" variant="body2">
            {actionData.error}
          </Typography>
        )}

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Login
        </Button>
      </Form>
    </div>
  );
};

export default Login;
