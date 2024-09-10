import { ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { prisma } from "../app/db.server";
import { createCookieSessionStorage } from "@remix-run/node";

// Configure session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
});

export const action: ActionFunction = async ({ request }) => {
  // Parse the form data
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  // Basic validation
  if (typeof username !== "string" || typeof password !== "string") {
    return json({ error: "Invalid form submission" }, { status: 400 });
  }

  // Check if the user exists in the database
  const user: any = await prisma.user.findUnique({
    where: { username },
  });

  // Check if user is found and password matches
  // if (!user || !(await bcrypt.compare(password, user.password))) {
  //   return json({ error: "Invalid username or password" }, { status: 400 });
  // }

  // Create a session
  const session = await sessionStorage.getSession();
  session.set("userId", user.id);
  session.set("userName", user.username);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};

const Login = () => {
  const actionData = useActionData();

  return (
    <div className="login-page w-full flex flex-col items-center justify-center min-h-screen lg:px-0 px-5 bg-slate-100">
      <Form
        method="post"
        className="flex flex-col lg:w-4/12 mx-auto w-full gap-4 bg-white lg:p-5 p-4 rounded-lg shadow"
      >
        <p className="lg:text-lg text-base text-[#121212] font-semibold">
          Login
        </p>

        <input
          type="text"
          name="username"
          placeholder="Username"
          className="p-3 outline-[#121212] w-full border border-[#808080]/20"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="p-3 outline-[#121212] w-full border border-[#808080]/20"
        />
        <button type="submit" className="bg-[#121212] p-3 text-white">
          Login
        </button>
      </Form>
    </div>
  );
};

export default Login;
