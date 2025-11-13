const login = process.env.ATL_SMS_LOGIN || "";
const password = process.env.ATL_SMS_PASSWORD || "";

export interface Recipient {
  msisdn: string;
  message: string;
}

export const buildIndividualSubmitXml = ({
  title,
  scheduled,
  controlId,
  recipients,
}: {
  title: string;
  scheduled: string;
  controlId: string;
  recipients: Recipient[];
}) => {
  const bodyParts = recipients
    .map(
      (r) => `
  <body>
    <msisdn>${r.msisdn}</msisdn>
    <message>${r.message}</message>
  </body>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <head>
    <operation>submit</operation>
    <login>${login}</login>
    <password>${password}</password>
    <title>${title}</title>
    <scheduled>${scheduled}</scheduled>
    <isbulk>false</isbulk>
    <controlid>${controlId}</controlid>
  </head>
  ${bodyParts}
</request>`;
};
