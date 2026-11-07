import pool from "../config/db.config.js";

export const findAllByClassId = async (classId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM assignments
    WHERE class_id = $1
    ORDER BY id ASC
    `,
    [classId],
  );
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(
    `
    SELECT * 
    FROM assignments
    WHERE id = $1
    `,
    [id],
  );
  return result.rows[0] || null;
};

export const create = async ({
  classId,
  title,
  description,
  deadline,
  maximumScore,
  createdBy,
}) => {
  const result = await pool.query(
    `
    INSERT INTO assignments (
      class_id,
      title,
      description,
      deadline,
      maximum_score,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      classId,
      title,
      description || null,
      deadline || null,
      maximumScore || 100,
      createdBy,
    ],
  );
  return result.rows[0];
};

export const update = async (id, { title, description, deadline, maximumScore }) => {
  const result = await pool.query(
    `
    UPDATE assignments 
    SET 
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      deadline = COALESCE($3, deadline),
      maximum_score = COALESCE($4, maximum_score),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
    [
      title ?? null,
      description ?? null,
      deadline ?? null,
      maximumScore ?? null,
      id,
    ],
  );
  return result.rows[0] || null;
};

export const deleteById = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM assignments
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );
  return result.rows[0] || null;
};