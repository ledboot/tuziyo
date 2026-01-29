import { redirect } from "react-router";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "home";

  // Valid pages that have static images
  const validPages = ["home", "inpainting", "resize", "crop", "convert"];
  const imagePage = validPages.includes(page) ? page : "home";

  return redirect(`/og-images/${imagePage}.png`);
}
