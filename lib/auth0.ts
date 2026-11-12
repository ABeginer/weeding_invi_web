import { Auth0Client } from "@auth0/nextjs-auth0/server";

let client: Auth0Client | null = null;

export function getAuth0(): Auth0Client {
  if (!client) {
    const audience = process.env.AUTH0_AUDIENCE;
    client = new Auth0Client({
      authorizationParameters: {
        ...(audience ? { audience } : {}),
        scope: "openid profile email offline_access",
      },
    });
  }
  return client;
}

