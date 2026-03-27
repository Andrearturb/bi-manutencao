"use client";

import { PublicClientApplication, type PopupRequest } from "@azure/msal-browser";

const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID;
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;

export const authConfigured = Boolean(tenantId && clientId);

const authority = tenantId
  ? `https://login.microsoftonline.com/${tenantId}`
  : "https://login.microsoftonline.com/common";

const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI;

const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "email"],
};

const msalApp = new PublicClientApplication({
  auth: {
    clientId: clientId ?? "",
    authority,
    redirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
  },
});

export async function loginWithMicrosoft(): Promise<string> {
  if (!authConfigured) {
    throw new Error("Login Microsoft nao configurado no frontend.");
  }

  await msalApp.initialize();
  const result = await msalApp.loginPopup(loginRequest);

  if (!result.idToken) {
    throw new Error("Nao foi possivel obter o token de login Microsoft.");
  }

  return result.idToken;
}

export async function logoutMicrosoft(): Promise<void> {
  if (!authConfigured) {
    return;
  }

  await msalApp.initialize();

  const account = msalApp.getAllAccounts()[0];
  if (!account) {
    return;
  }

  await msalApp.logoutPopup({ account });
}
