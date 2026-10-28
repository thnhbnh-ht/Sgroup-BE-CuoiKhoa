import pool from "../config/db.config.js";

export const findByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email, age, role, created_at AS \"createdAt\" FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

export const create = async ({ name, email, age, password, role = 'MEMBER' }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, age, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, age, role, created_at AS "createdAt"`,
    [name, email, age || null, password, role]
  );
  return result.rows[0];
};

export const findAll = async () => {
  const result = await pool.query("SELECT id, name, email, age, role, created_at AS \"createdAt\" FROM users ORDER BY id ASC");
  return result.rows;
};