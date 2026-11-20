import express from "express";
import cookieParser from "cookie-parser";
import router from "./route/route.js";
import errorHandler from "./middleware/errorHandler.js";
import { NotFoundError } from "./core/error.response.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", router);

app.use((req, res, next) => {
  next(new NotFoundError(`Resource ${req.originalUrl} not found`));
});

app.use(errorHandler);

export default app;