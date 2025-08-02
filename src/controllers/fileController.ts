import dotenv from "dotenv";
import { Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { UserRequest } from "../types";
import s3 from "../utils/aws"; // Import the AWS S3 instance
import logger from "../utils/logger";
import { sendErrorResponse } from "../utils/response";
dotenv.config();

// Set up Multer storage for S3 file upload
const storage = multer.memoryStorage(); // Store the file in memory before uploading it to S3

const fileFilter = (
  req: UserRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // Max file size 10MB
}).array("files");

const FileController = () => {
  const uploadFiles = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const fileUrls: string[] = []; // Initialize an array to store file URLs

      upload(req, res, async (err) => {
        if (err) {
          logError("Multer Error: ", err);
          return sendErrorResponse({
            res,
            statusCode: 400,
            error: err.message,
          });
        }

        if (req.files && Array.isArray(req.files)) {
          const uploadPromises = req.files.map((file: Express.Multer.File) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: fileName,
              Body: file.buffer,
              ContentType: file.mimetype,
            };

            return new Promise((resolve, reject) => {
              s3.upload(params, (uploadError: Error | null, data: any) => {
                if (uploadError) {
                  logError("Multer Error: ", uploadError);
                  reject("Error uploading file to S3");
                } else {
                  fileUrls.push(data.Location);
                  resolve(data.Location);
                }
              });
            });
          });

          await Promise.all(uploadPromises).catch((uploadError) => {
            logError("File upload failed: ", uploadError);
            return sendErrorResponse({
              res,
              statusCode: 500,
              error: "Failed to upload files to S3",
            });
          });
        }

        return res.json({
          msg: "Files uploaded successfully",
          data: { fileUrls },
          statusCode: 201,
        });
      });
    } catch (error: any) {
      return res.status(500).json({
        msg: "Files upload failed.",
        statusCode: 500,
        error: error.message,
      });
    }
  };

  const logError = (context: string, value?: any) =>
    logger.error(`File - ${context} => ${JSON.stringify(value)}`);

  return {
    uploadFiles,
  };
};

export default FileController;
