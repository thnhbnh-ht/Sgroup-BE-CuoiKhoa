import pool from "../config/db.config.js";

export const findAll = async ({
  page = 1,
  limit = 10,
  search,
  role,
  sortBy = "id",
  order = "asc",
} = {}) => {
  const validSortColumns = ["id", "name", "email", "created_at"];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : "id";
  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (search && search.trim() !== "") {
    conditions.push(
      `(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`,
    );
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  if (role && role.trim() !== "") {
    conditions.push(`EXISTS (
      SELECT 1 FROM user_roles ur2
      JOIN roles r2 ON r2.id = ur2.role_id
      WHERE ur2.user_id = u.id AND r2.name ILIKE $${paramIndex}
    )`);
    values.push(role.trim().toUpperCase());
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(u.id)::int AS total FROM users u ${whereClause}`,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const dataResult = await pool.query(
    `
    SELECT 
        u.id, u.name, u.email, u.created_at,
        COALESCE(
            array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), 
            '{}'
        ) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.${sortCol} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  return {
    users: dataResult.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const findByEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT 
        u.id, u.name, u.email, u.password, u.created_at,
        COALESCE(
            array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), 
            '{}'
        ) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.email = $1
    GROUP BY u.id
    `,
    [email],
  );

  return result.rows[0] || null;
};

export const findById = async (id) => {
  const result = await pool.query(
    `
    SELECT 
        u.id, u.name, u.email, u.created_at,
        COALESCE(
            array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), 
            '{}'
        ) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.id = $1
    GROUP BY u.id
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const create = async ({ name, email, password }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
      `,
      [name, email, password],
    );

    const user = userResult.rows[0];

    const roleResult = await client.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = 'MEMBER'
      `,
    );

    const selectedRole = roleResult.rows[0];

    if (!selectedRole) {
      throw new Error("Default MEMBER role not found");
    }

    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      `,
      [user.id, selectedRole.id],
    );

    await client.query("COMMIT");

    return {
      ...user,
      roles: [selectedRole.name],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const update = async (id, { name, email }) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email) 
     WHERE id = $3 
     RETURNING *`,
    [name ?? null, email ?? null, id],
  );
  return result.rows[0] || null;
};

export const deleteById = async (id) => {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0] || null;
};

export const findUserWithRoles = async (id) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.created_at,

      COALESCE(
        ARRAY_AGG(DISTINCT r.name)
        FILTER (WHERE r.id IS NOT NULL),
        '{}'
      ) AS roles,

      COALESCE(
        ARRAY_AGG(DISTINCT p.name)
        FILTER (WHERE p.id IS NOT NULL),
        '{}'
      ) AS permissions

    FROM users u

    LEFT JOIN user_roles ur
      ON ur.user_id = u.id

    LEFT JOIN roles r
      ON r.id = ur.role_id

    LEFT JOIN role_permissions rp
      ON rp.role_id = r.id

    LEFT JOIN permissions p
      ON p.id = rp.permission_id

    WHERE u.id = $1

    GROUP BY u.id
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const findPermissionsByUserId = async (userId) => {
  const result = await pool.query(
    `
    SELECT DISTINCT p.name
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = $1
    `,
    [userId],
  );

  return result.rows.map((row) => row.name);
};

export const findByIdWithToken = async (id) => {
  const result = await pool.query(
    `
    SELECT 
        u.id, u.name, u.email, u.refresh_token, u.created_at,
        COALESCE(
            array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), 
            '{}'
        ) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.id = $1
    GROUP BY u.id
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const findByRefreshToken = async (refreshToken) => {
  const result = await pool.query(
    `
    SELECT 
        u.id, u.name, u.email, u.refresh_token, u.created_at,
        COALESCE(
            array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), 
            '{}'
        ) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.refresh_token = $1
    GROUP BY u.id
    `,
    [refreshToken],
  );

  return result.rows[0] || null;
};

export const updateRefreshToken = async (userId, refreshToken) => {
  const result = await pool.query(
    `
    UPDATE users
    SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, name, email, refresh_token
    `,
    [refreshToken, userId],
  );

  return result.rows[0] || null;
};
