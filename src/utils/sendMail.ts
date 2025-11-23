import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import logger from "./logger";

const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;
const sender = process.env.GRAPH_SENDER!; // e.g. no-reply@imed.az

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

async function getAccessToken() {
  const scope = "https://graph.microsoft.com/.default";
  const token = await credential.getToken(scope);
  if (!token) {
    throw new Error("Could not obtain access token from Azure AD");
  }
  return token.token;
}

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send email via Microsoft Graph as GRAPH_SENDER (no-reply@imed.az)
 */
export async function sendMail(options: SendMailOptions) {
  const accessToken = await getAccessToken();
  const client = getGraphClient(accessToken);

  const message = {
    subject: options.subject,
    body: {
      contentType: options.html ? "HTML" : "Text",
      content: options.html || options.text || "",
    },
    toRecipients: [
      {
        emailAddress: {
          address: options.to,
        },
      },
    ],
    from: {
      emailAddress: {
        address: sender,
      },
    },
  };

  try {
    await client.api(`/users/${sender}/sendMail`).post({
      message,
      saveToSentItems: false,
    });
  } catch (error) {
    logger.error(`Send mail to ${options.to} => ${JSON.stringify(error)}`);
  }
}
