import pool from "../config/db.config.js";

export const findAll = async () => {
  const result = await pool.query(`SELECT * FROM classes ORDER BY id`);

  return result.rows;
};

export const findAllByMemberId = async (userId) => {
  const result = await pool.query(
    `
    SELECT c.*
    FROM classes c
    JOIN class_members cm
      ON cm.class_id = c.id
    WHERE cm.member_id = $1
    ORDER BY c.id
    `,
    [userId],
  );

  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(`SELECT * FROM classes WHERE id=$1`, [id]);

  return result.rows[0] || null;
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

export const findMembersByClassId = async (classId) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      cm.joined_at
    FROM class_members cm
    JOIN users u
      ON u.id = cm.member_id
    WHERE cm.class_id = $1
    ORDER BY u.id
    `,
    [classId],
  );

  return result.rows;
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
