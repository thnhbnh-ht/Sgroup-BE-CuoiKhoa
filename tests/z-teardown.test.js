import { after } from "node:test";
import pool from "../src/config/db.config.js";

after(async () => {
  await pool.end();
});