import pool from "../config/db.config.js";
import { execSync } from "child_process";

async function resetDB() {
  const client = await pool.connect();
  try {
    console.log("🧹 Đang làm sạch cơ sở dữ liệu (xóa toàn bộ bảng cũ)...");
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("✅ Đã xóa sạch database cũ!");
  } finally {
    client.release();
    await pool.end();
  }

  console.log("🚀 Đang chạy migration khởi tạo bảng & permissions...");
  execSync("node src/db/migrate.js", { stdio: "inherit" });

  console.log("🌱 Đang nạp toàn bộ dữ liệu mẫu (Admin, 10 Mentors, 30 Members, 5 Classes)...");
  execSync("node src/db/seed.js", { stdio: "inherit" });

  console.log("🎉 XONG! Database đã được tạo mới và nạp dữ liệu hoàn chỉnh 100%!");
}

resetDB().catch((err) => {
  console.error("❌ Reset database thất bại:", err.message);
  process.exit(1);
});
