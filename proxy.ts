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

