import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { destroySessionCookie } from "../lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySessionCookie(),
    },
  });
}

export async function loader() {
  return redirect("/");
}
