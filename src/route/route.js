import { Router } from "express";
import userRouter from "./users.route.js";
import authRouter from "./auth.route.js";
import classRouter from "./class.route.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/classes", classRouter);

export default router;
