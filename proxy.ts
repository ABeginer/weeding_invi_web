import { NextRequest, NextResponse } from "next/server";
import { getAuth0 } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
  const auth0 = getAuth0();
  const authRes = await auth0.middleware(request);

  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await auth0.getSession(request);
    if (!session) {
      const returnTo = encodeURIComponent(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(
        new URL(`/auth/login?returnTo=${returnTo}`, request.url),
      );
    }
  }

  // Stable browser key for counting unique views of a personalised invite.
  if (
    request.nextUrl.pathname.startsWith("/m/") &&
    !request.cookies.get("invite_view_key")
  ) {
    authRes.cookies.set("invite_view_key", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return authRes;
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/m/:path*",
  ],
};

