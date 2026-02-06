import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connection = process.env.MONGO_URI as string;

mongoose.connect(connection).catch((err) => {
  console.error("MongoDB connection error:", err.message);
});

const db = mongoose.connection;

// successful connection
db.on("connected", () => {
  console.log("Connected!!!");
});

export default db;
