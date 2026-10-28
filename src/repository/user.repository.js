import pool from "../config/db.config.js";

export const findAll = async ({ sortBy = "id", order = "asc" }) => {
  const validSortColumns = ["id", "name", "email"];

  if (!validSortColumns.includes(sortBy)) {
    throw new Error(`Invalid sort column: ${sortBy}`);
  }

  const validOrder = ["asc", "desc"];
  if (!validOrder.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }

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
    GROUP BY u.id
    ORDER BY u.${sortBy} ${order}
    `,
  );

  return result.rows;
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
