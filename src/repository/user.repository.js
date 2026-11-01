import pool from "../config/db.config.js";

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