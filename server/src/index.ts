import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "fixflow-api",
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`FixFlow API listening on port ${port}`);
});