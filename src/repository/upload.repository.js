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

export const findAllByUserId = async (
  userId,
  { page = 1, limit = 10, search, mimeType } = {},
) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ["uploaded_by = $1"];
  const values = [userId];
  let paramIndex = 2;

  if (search && search.trim() !== "") {
    conditions.push(`original_name ILIKE $${paramIndex}`);
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  if (mimeType && mimeType.trim() !== "") {
    conditions.push(`mime_type ILIKE $${paramIndex}`);
    values.push(`%${mimeType.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(id)::int AS total FROM uploads WHERE ${whereClause}`,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const dataResult = await pool.query(
    `
    SELECT *
    FROM uploads
    WHERE ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  return {
    uploads: dataResult.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

