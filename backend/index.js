import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import createHttpError from "http-errors";

import authRoutes from "./routes/authRoutes.js";
import draftRoutes from "./routes/draftRoutes.js";
import docketRoutes from "./routes/docketsRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import finalizationRoutes from "./routes/finalizationRoutes.js";
import rejection102Routes from "./routes/rejection102Routes.js";
import rejection103Routes from "./routes/rejection103Routes.js";
import otherRejectionsRoutes from "./routes/otherRejectionsRoutes.js";
import clearBlacklistedTokenScheduler from "./libs/clearBlacklistedTokenScheduler.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: `${process.env.CORS_ORIGIN_URL}`, credentials: true }));

app.get("/", (req, res, next) => {
  res.send("Welcome");
});

app.use("/api/auth", authRoutes);
app.use("/api/draft", draftRoutes);
app.use("/api/docket", docketRoutes);
app.use("/api/tabs/102", rejection102Routes);
app.use("/api/tabs/103", rejection103Routes);
app.use("/api/rejection", finalizationRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/rejection/other", otherRejectionsRoutes);

const PORT = process.env.PORT || 3000;
const enviroment = process.env.NODE_ENV;
const connectionString = process.env.MONGODB_URL;

app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
  if (enviroment === "development") {
    console.error(error);
  }
  error.status = error.status || 500;
  res.status(error.status).json(error.message);
});

clearBlacklistedTokenScheduler;

(async () => {
  try {
    await mongoose.connect(connectionString);
    app.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
