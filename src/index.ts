import dotenv from "dotenv";
dotenv.config();
import "./config/prisma";

import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import logger from "./utils/logger";
import { sendSuccessResponse } from "./utils/response";
import routes from "./routes";
import errorMiddleware from "./middlewares/error";

const app: express.Application = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: "*",
  }),
);

app.get("/", (_: Request, res: Response) =>
  sendSuccessResponse({
    res,
    message: "Hello From Imed Backend!!!",
  }),
);

app.use("/api/v1", routes);

// Error Middleware
app.use(errorMiddleware as any);

const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  try {
    logger.info(`Server is running on port ${PORT}`);
  } catch (error) {
    throw new Error(error?.message || error);
  }
});

process.on("unhandledRejection", () => {
  process.exit(1);
});
