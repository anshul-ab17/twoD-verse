import "dotenv/config";
import express from "express";
import { router } from "./routes/v1/index.js";
import { prisma } from "@repo/db";


const app = express();
app.use(express.json());

app.use('/api/v1/', router);





app.listen(3000)