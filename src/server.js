import app from "./app.js";
import dotenv from "dotenv";
import connectDb from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;
connectDb();

app.listen(port, () => console.log(`server is running in port ${port}`));
