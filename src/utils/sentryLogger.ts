
import Sentry from "@sentry/node";
import type {SeverityLevel} from "@sentry/core/build/types/types-hoist/severity";

class SentryLogger {

    constructor() {
        Sentry.init({
            dsn: "https://cc46c25636ae21357d7594d1a3c41ae5@o4509672215412736.ingest.de.sentry.io/4509678758133840",
            sendDefaultPii: true,
        });
    }

    logMessage = (message: string, context?: any, user?: any, level: SeverityLevel = "info"): void => {
        Sentry.withScope(scope => {
            if (user) {
                scope.setUser({ id: user._id, email: user.email });
            }
            if (context) {
                scope.setContext("request_body", context);
            }

            Sentry.captureMessage(message, level);
        });
    }

    logException = (error: any, context?: any, user?: any) => {
        Sentry.withScope(scope => {
            if (user) {
                scope.setUser({ id: user._id, email: user.email });
            }
            if (context) {
                scope.setContext("request_body", context);
            }

            const message = error?.message || error?.response?.data || error;
            const wrappedError = new Error(message || "Unknown error");

            if (error.stack) {
                wrappedError.stack += `\nCaused by: ${error.stack}`;
            }

            Sentry.captureException(wrappedError);
        });
    }

}

export const sentryLogger = new SentryLogger();