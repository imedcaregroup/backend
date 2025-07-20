import process from "node:process";
import axios from "axios";
import { sentryLogger } from "../utils/sentryLogger";

export class EmailJsService {
  private readonly config: any;

  constructor() {
    this.config = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      public_key: process.env.EMAILJS_PUBLIC_KEY,
      private_key: process.env.EMAILJS_PRIVATE_KEY,
    };
  }

  public async sendMessage(
    to: string,
    templateId: string,
    params: any,
  ): Promise<any> {
    try {
      await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
        service_id: this.config.service_id,
        template_id: templateId,
        user_id: this.config.public_key,
        accessToken: this.config.private_key,
        template_params: {
          from_name: "IMed",
          email: to,
          ...params,
        },
      });
      return true;
    } catch (error) {
      sentryLogger.logException(
        "Failed to send email: " + error.message,
        this.config,
      );
      return false;
    }
  }
}
