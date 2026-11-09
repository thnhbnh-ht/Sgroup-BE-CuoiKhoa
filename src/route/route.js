import { Router } from "express";
import userRouter from "./users.route.js";
import authRouter from "./auth.route.js";
import classRouter from "./class.route.js";
import lessonRouter from "./lesson.route.js";
import assignmentRouter from "./assignments.route.js";
import submissionRouter from "./submissions.route.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/classes", classRouter);
router.use("/lessons", lessonRouter);
router.use("/assignments", assignmentRouter);
router.use("/submissions", submissionRouter);

export default router;
