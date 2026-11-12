import pool from "../config/db.config.js";

export const create = async ({
  originalName,
  mimeType,
  size,
  objectKey,
  url,
  uploadedBy,
}) => {
  const result = await pool.query(
    `
    INSERT INTO uploads (
      original_name,
      mime_type,
      size,
      object_key,
      url,
      uploaded_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [originalName, mimeType, size, objectKey, url, uploadedBy],
  );

  return result.rows[0];
};

export const findById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM uploads
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const findAllByUserId = async (userId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM uploads
    WHERE uploaded_by = $1
    ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );

  return result.rows;
};

