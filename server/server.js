// โหลด .env เฉพาะตอน dev เท่านั้น (กัน Render อ่าน .env ในโปรเจกต์)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");

const uploadRoute = require("./routes/upload");
const documentRoute = require("./routes/documents");
const adminRoutes = require("./routes/admin");
const downloadRoute = require("./routes/download");
const loginRoute = require("./routes/login");
const signupRoute = require("./routes/signup");
const authRoute = require("./routes/auth");
const filesRoute = require("./routes/files");
const sectionFilesRoute = require("./routes/sectionFiles");
const categoriesRoute = require("./routes/categories");
const dbTestRoute = require("./routes/dbTest");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://project-sci-digiknowledge1.onrender.com",
      "https://project-sci-digiknowledge.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/upload", uploadRoute);
app.use("/api/documents", documentRoute);
app.use("/api/login", loginRoute);
app.use("/api/signup", signupRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api", sectionFilesRoute);
app.use("/files", filesRoute);
app.use("/download", downloadRoute);
app.use("/api/db-test", dbTestRoute);

app.get("/", (req, res) => {
  res.send("Welcome to the API server");
});

// ✅ error handler กลาง (ทำให้ 500 มี log ชัด)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});