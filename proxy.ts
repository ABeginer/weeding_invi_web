import { NextRequest, NextResponse } from "next/server";
import { getAuth0 } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
  // 1. Production domain 301 Permanent Redirect (workers.dev -> https://inviwedd.date)
  const host = request.headers.get("host") || request.nextUrl.hostname;
  const hostname = host.split(":")[0].toLowerCase();

  // Exactly wedding-invitation.inviwedd.workers.dev (do NOT redirect staging, localhost, or inviwedd.date)
  if (hostname === "wedding-invitation.inviwedd.workers.dev") {
    // Skip redirect for POST API webhooks so in-flight webhooks never break
    const isWebhook =
      request.method === "POST" &&
      (request.nextUrl.pathname.startsWith("/api/webhooks") ||
        request.nextUrl.pathname.includes("/webhook") ||
        request.nextUrl.pathname.startsWith("/api/orders/payos") ||
        request.nextUrl.pathname.startsWith("/api/payos"));

    if (!isWebhook) {
      const targetUrl = new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        "https://inviwedd.date",
      );
      return NextResponse.redirect(targetUrl, 301);
    }
  }

  // 2. Redirect legacy template slug: /mau/basic-1 -> /mau/vuon-o-liu
  if (request.nextUrl.pathname === "/mau/basic-1") {
    const targetUrl = new URL(
      `/mau/vuon-o-liu${request.nextUrl.search}`,
      request.url,
    );
    return NextResponse.redirect(targetUrl, 301);
  }

  const auth0 = getAuth0();

  if (request.nextUrl.pathname.startsWith("/auth")) {
    return auth0.middleware(request);
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
    return auth0.middleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

