import pool from "../config/db.config.js";

export const findAll = async ({
  page = 1,
  limit = 10,
  search,
  status,
  mentorId,
  sortBy = "id",
  order = "asc",
  userId = null,
  isAdmin = false,
} = {}) => {
  const validSortColumns = ["id", "name", "start_date", "end_date", "created_at"];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : "id";
  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (!isAdmin && userId) {
    conditions.push(
      `(c.mentor_id = $${paramIndex} OR EXISTS (SELECT 1 FROM class_members cm WHERE cm.class_id = c.id AND cm.member_id = $${paramIndex}))`,
    );
    values.push(userId);
    paramIndex++;
  }

  if (search && search.trim() !== "") {
    conditions.push(
      `(c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`,
    );
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  if (mentorId) {
    conditions.push(`c.mentor_id = $${paramIndex}`);
    values.push(mentorId);
    paramIndex++;
  }

  if (status === "upcoming") {
    conditions.push(`c.start_date > CURRENT_DATE`);
  } else if (status === "completed") {
    conditions.push(`(c.end_date IS NOT NULL AND c.end_date < CURRENT_DATE)`);
  } else if (status === "ongoing") {
    conditions.push(
      `((c.start_date IS NULL OR c.start_date <= CURRENT_DATE) AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE))`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `
    SELECT COUNT(c.id)::int AS total
    FROM classes c
    ${whereClause}
    `,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const dataResult = await pool.query(
    `
    SELECT 
      c.id,
      c.name,
      c.description,
      c.start_date,
      c.end_date,
      c.mentor_id,
      c.created_by,
      c.created_at,
      c.updated_at,
      CASE
        WHEN c.start_date > CURRENT_DATE THEN 'upcoming'
        WHEN c.end_date < CURRENT_DATE THEN 'completed'
        ELSE 'ongoing'
      END AS status,
      u_mentor.id AS mentor_user_id,
      u_mentor.name AS mentor_name,
      u_mentor.email AS mentor_email,
      COUNT(DISTINCT cm.member_id)::int AS total_mentees
    FROM classes c
    LEFT JOIN users u_mentor ON u_mentor.id = c.mentor_id
    LEFT JOIN class_members cm ON cm.class_id = c.id
    ${whereClause}
    GROUP BY c.id, u_mentor.id
    ORDER BY c.${sortCol} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  const classes = dataResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    mentor: row.mentor_user_id
      ? {
          id: row.mentor_user_id,
          name: row.mentor_name,
          email: row.mentor_email,
        }
      : null,
    totalMentees: row.total_mentees,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    classes,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const findAllByMemberId = async (userId) => {
  return await findAll({ userId, isAdmin: false });
};

export const findById = async (id) => {
  const result = await pool.query(`SELECT * FROM classes WHERE id=$1`, [id]);

  return result.rows[0] || null;
};

export const findByIdWithDetails = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      c.id,
      c.name,
      c.description,
      c.start_date,
      c.end_date,
      c.mentor_id,
      c.created_by,
      c.created_at,
      c.updated_at,
      CASE
        WHEN c.start_date > CURRENT_DATE THEN 'upcoming'
        WHEN c.end_date < CURRENT_DATE THEN 'completed'
        ELSE 'ongoing'
      END AS status,
      u_mentor.id AS mentor_user_id,
      u_mentor.name AS mentor_name,
      u_mentor.email AS mentor_email,
      COUNT(DISTINCT cm.member_id)::int AS total_mentees,
      COALESCE(
        json_agg(
          json_build_object('id', u_member.id, 'name', u_member.name)
          ORDER BY u_member.name ASC
        ) FILTER (WHERE u_member.id IS NOT NULL),
        '[]'::json
      ) AS mentees
    FROM classes c
    LEFT JOIN users u_mentor ON u_mentor.id = c.mentor_id
    LEFT JOIN class_members cm ON cm.class_id = c.id
    LEFT JOIN users u_member ON u_member.id = cm.member_id
    WHERE c.id = $1
    GROUP BY c.id, u_mentor.id
    `,
    [id],
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    mentor: row.mentor_user_id
      ? {
          id: row.mentor_user_id,
          name: row.mentor_name,
          email: row.mentor_email,
        }
      : null,
    totalMentees: row.total_mentees,
    mentees: row.mentees,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const isMemberOfClass = async (classId, userId) => {
  const result = await pool.query(
    `
    SELECT 1
    FROM class_members
    WHERE class_id = $1
    AND member_id = $2
    `,
    [classId, userId],
  );

  return result.rows.length > 0;
};

export const isMentorOfClass = async (classId, userId) => {
  const result = await pool.query(
    `
    SELECT 1
    FROM classes
    WHERE id = $1
    AND mentor_id = $2
    `,
    [classId, userId],
  );

  return result.rows.length > 0;
};

export const create = async ({
  name,
  description,
  startDate,
  endDate,
  mentorId,
  createdBy,
}) => {
  const result = await pool.query(
    `
    INSERT INTO classes (
      name,
      description,
      start_date,
      end_date,
      mentor_id,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [name, description, startDate, endDate, mentorId ?? null, createdBy],
  );

  return result.rows[0];
};

export const update = async (
  id,
  { name, description, startDate, endDate, mentorId },
) => {
  const result = await pool.query(
    `
    UPDATE classes
    SET 
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      start_date = COALESCE($3, start_date),
      end_date = COALESCE($4, end_date),
      mentor_id = COALESCE($5, mentor_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *
    `,
    [
      name ?? null,
      description ?? null,
      startDate ?? null,
      endDate ?? null,
      mentorId ?? null,
      id,
    ],
  );

  return result.rows[0] || null;
};

export const deleteById = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM classes
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const findMembersByClassId = async (
  classId,
  { page = 1, limit = 10, search, sortBy = "id", order = "asc" } = {},
) => {
  const validSortColumns = ["id", "name", "email", "joined_at"];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : "id";
  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ["cm.class_id = $1"];
  const values = [classId];
  let paramIndex = 2;

  if (search && search.trim() !== "") {
    conditions.push(
      `(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`,
    );
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `
    SELECT COUNT(cm.member_id)::int AS total
    FROM class_members cm
    JOIN users u ON u.id = cm.member_id
    WHERE ${whereClause}
    `,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const sortColumnExpression =
    sortCol === "joined_at" ? "cm.joined_at" : `u.${sortCol}`;

  const dataResult = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      cm.joined_at
    FROM class_members cm
    JOIN users u
      ON u.id = cm.member_id
    WHERE ${whereClause}
    ORDER BY ${sortColumnExpression} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  return {
    members: dataResult.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const addMember = async (classId, memberId) => {
  const result = await pool.query(
    `
    INSERT INTO class_members (class_id, member_id)
    VALUES ($1, $2)
    RETURNING *
    `,
    [classId, memberId],
  );

  return result.rows[0];
};

export const removeMember = async (classId, memberId) => {
  const result = await pool.query(
    `
    DELETE FROM class_members
    WHERE class_id = $1 AND member_id = $2
    RETURNING *
    `,
    [classId, memberId],
  );

  return result.rows[0] || null;
};

export const assignMentor = async (classId, mentorId) => {
  const result = await pool.query(
    `
    UPDATE classes
    SET mentor_id = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [mentorId, classId],
  );

  return result.rows[0] || null;
};
