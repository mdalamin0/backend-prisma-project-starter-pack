import { Router } from "express";
import { userControllers } from "./user.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";

const router = Router();

router.patch(
  "/profile-image",
  auth(Role.ADMIN, Role.USER),
  upload.single("profileImage"),
  userControllers.uploadProfileImage,
);

export const userRoutes = router;
