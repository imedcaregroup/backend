import { Router } from "express";
import FileController from "../controllers/fileController";

const fileController = FileController();

const router = Router();

router.route("/upload").post(fileController.uploadFiles);

export default router;
