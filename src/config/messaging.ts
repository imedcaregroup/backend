import admin, { ServiceAccount } from "firebase-admin";
import googleApplicationCredentials from "../service-account.json";

admin.initializeApp({
  credential: admin.credential.cert(
    googleApplicationCredentials as ServiceAccount,
  ),
});

export const messaging = admin.messaging();
