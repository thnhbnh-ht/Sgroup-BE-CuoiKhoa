import pool from "../config/db.config.js";

export const findAllByClassId = async (classId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM lessons
    WHERE class_id = $1
    ORDER BY lesson_order, id
    `,
    [classId],
  );
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(
    `
    SELECT * 
    FROM lessons
    WHERE id = $1
    `,
    [id],
  );
  return result.rows[0] || null;
};

export const create = async ({
  classId,
  title,
  content,
  lessonOrder,
  createdBy,
}) => {
  const result = await pool.query(
    `
    INSERT INTO lessons (
      class_id,
      title,
      content,
      lesson_order,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [classId, title, content || null, lessonOrder || 0, createdBy],
  );
  return result.rows[0];
};

export const update = async (id, { title, content, lessonOrder }) => {
  const result = await pool.query(
    `
    UPDATE lessons 
    SET 
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      lesson_order = COALESCE($3, lesson_order),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
    `,
    [title ?? null, content ?? null, lessonOrder ?? null, id],
  );
  return result.rows[0] || null;
};

export const deleteById = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM lessons
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );
  return result.rows[0] || null;
};

export const completeLesson = async (lessonId, memberId) => {
  const result = await pool.query(
    `
    INSERT INTO lesson_progress (
      lesson_id,
      member_id,
      completed_at
    )
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    RETURNING *
    `,
    [lessonId, memberId],
  );
  return result.rows[0];
};

export const findProgress = async (lessonId, memberId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM lesson_progress
    WHERE lesson_id = $1
      AND member_id = $2
    `,
    [lessonId, memberId],
  );
  return result.rows[0] || null;
};

export const getClassProgress = async (classId, memberId) => {
  const result = await pool.query(
    `
    SELECT 
      COUNT(l.id)::INT AS "totalLessons",
      COUNT(lp.lesson_id)::INT AS "completedLessons"
    FROM lessons l
    LEFT JOIN lesson_progress lp 
      ON lp.lesson_id = l.id AND lp.member_id = $2
    WHERE l.class_id = $1
    `,
    [classId, memberId]
  );
  return result.rows[0] || { totalLessons: 0, completedLessons: 0 };
};