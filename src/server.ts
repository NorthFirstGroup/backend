/** @format */

import app from "./app";
import { AppDataSource } from "./db";

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => console.error("Database init error:", err));
