import express from "express";
import cors from "cors";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import notFoundHandler from "./app/middlewares/notFoundHandeler";
import globalErrorHandler from "./app/middlewares/globalErrorHandeler";

const app = express();

// Enable cookie parsing
app.use(cookieParser());

// Middleware for parsing JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// app.use(express.static("./uploads"));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to Astrotitan! Api is up and running.");
});

// Application routes
app.use("/api/v1", router);

// Catch-all route for handling 404 errors
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

export default app;
