import pool from "../config/db.config.js";

export const findAllByClassId = async (
  classId,
  { page = 1, limit = 10, search, status, sortBy = "id", order = "asc" } = {},
) => {
  const validSortColumns = [
    "id",
    "title",
    "deadline",
    "created_at",
    "maximum_score",
  ];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : "id";
  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ["class_id = $1"];
  const values = [classId];
  let paramIndex = 2;

  if (search && search.trim() !== "") {
    conditions.push(
      `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`,
    );
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  if (status === "active") {
    conditions.push(`(deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)`);
  } else if (status === "expired" || status === "overdue") {
    conditions.push(`(deadline IS NOT NULL AND deadline < CURRENT_TIMESTAMP)`);
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(id)::int AS total FROM assignments WHERE ${whereClause}`,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const dataResult = await pool.query(
    `
    SELECT *
    FROM assignments
    WHERE ${whereClause}
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  return {
    assignments: dataResult.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
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