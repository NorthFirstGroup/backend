/** @format */

import express from "express";
import userRoutes from "./routes/user.routes";

const app = express();
app.use(express.json());

// API routes
app.use("/api/v1/users", userRoutes);

export default app;
