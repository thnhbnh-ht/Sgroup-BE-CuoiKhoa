import pool from "../config/db.config.js";

const ATTACHMENTS_SUBQUERY = `
  COALESCE(
    (
      SELECT json_agg(json_build_object(
        'id', u.id,
        'originalName', u.original_name,
        'mimeType', u.mime_type,
        'size', u.size,
        'url', u.url,
        'createdAt', u.created_at
      ))
      FROM (
        SELECT u.id, u.original_name, u.mime_type, u.size, u.url, u.created_at
        FROM submission_attachments sa
        JOIN uploads u ON u.id = sa.upload_id
        WHERE sa.submission_id = s.id
        UNION
        SELECT u.id, u.original_name, u.mime_type, u.size, u.url, u.created_at
        FROM uploads u
        WHERE u.url = s.repository_url
      ) u
    ),
    '[]'::json
  ) AS attachments
`;

const formatSubmissionWithAttachment = (row) => {
  if (!row) return null;
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  return {
    ...row,
    attachments,
    attachment: attachments[0] || null,
  };
};

export const findByAssignmentAndMember = async (assignmentId, memberId) => {
  const result = await pool.query(
    `
    SELECT 
      s.id,
      s.assignment_id,
      s.member_id,
      s.content,
      s.repository_url,
      s.submitted_at,
      s.score,
      s.feedback,
      s.reviewed_by,
      s.reviewed_at,
      a.title AS assignment_title,
      a.deadline AS assignment_deadline,
      a.maximum_score AS assignment_maximum_score,
      a.class_id AS class_id,
      u_member.name AS member_name,
      u_member.email AS member_email,
      u_reviewer.name AS reviewer_name,
      u_reviewer.email AS reviewer_email,
      ${ATTACHMENTS_SUBQUERY}
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN users u_member ON u_member.id = s.member_id
    LEFT JOIN users u_reviewer ON u_reviewer.id = s.reviewed_by
    WHERE s.assignment_id = $1
      AND s.member_id = $2
    `,
    [assignmentId, memberId],
  );

  return formatSubmissionWithAttachment(result.rows[0]);
};

export const findById = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      s.id,
      s.assignment_id,
      s.member_id,
      s.content,
      s.repository_url,
      s.submitted_at,
      s.score,
      s.feedback,
      s.reviewed_by,
      s.reviewed_at,
      a.title AS assignment_title,
      a.deadline AS assignment_deadline,
      a.maximum_score AS assignment_maximum_score,
      a.class_id AS class_id,
      c.name AS class_name,
      u_member.name AS member_name,
      u_member.email AS member_email,
      u_reviewer.name AS reviewer_name,
      u_reviewer.email AS reviewer_email,
      ${ATTACHMENTS_SUBQUERY}
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN classes c ON c.id = a.class_id
    JOIN users u_member ON u_member.id = s.member_id
    LEFT JOIN users u_reviewer ON u_reviewer.id = s.reviewed_by
    WHERE s.id = $1
    `,
    [id],
  );

  return formatSubmissionWithAttachment(result.rows[0]);
};

export const findAllByAssignmentId = async (
  assignmentId,
  { page = 1, limit = 10, status, search, sortBy = "submitted_at", order = "desc" } = {},
) => {
  const validSortColumns = ["id", "submitted_at", "score"];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : "submitted_at";
  const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ["s.assignment_id = $1"];
  const values = [assignmentId];
  let paramIndex = 2;

  if (status === "graded") {
    conditions.push("s.score IS NOT NULL");
  } else if (status === "pending" || status === "ungraded") {
    conditions.push("s.score IS NULL");
  }

  if (search && search.trim() !== "") {
    conditions.push(
      `(u_member.name ILIKE $${paramIndex} OR u_member.email ILIKE $${paramIndex})`,
    );
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `
    SELECT COUNT(s.id)::int AS total
    FROM submissions s
    JOIN users u_member ON u_member.id = s.member_id
    WHERE ${whereClause}
    `,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const dataResult = await pool.query(
    `
    SELECT 
      s.id,
      s.assignment_id,
      s.member_id,
      s.content,
      s.repository_url,
      s.submitted_at,
      s.score,
      s.feedback,
      s.reviewed_by,
      s.reviewed_at,
      u_member.name AS member_name,
      u_member.email AS member_email,
      u_reviewer.name AS reviewer_name,
      u_reviewer.email AS reviewer_email,
      ${ATTACHMENTS_SUBQUERY}
    FROM submissions s
    JOIN users u_member ON u_member.id = s.member_id
    LEFT JOIN users u_reviewer ON u_reviewer.id = s.reviewed_by
    WHERE ${whereClause}
    ORDER BY s.${sortCol} ${sortOrder}, s.id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  return {
    submissions: dataResult.rows.map(formatSubmissionWithAttachment),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const findAssignmentById = async (id) => {
  const result = await pool.query(`SELECT * FROM assignments WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] || null;
};

export const findAllByMemberId = async (
  memberId,
  { page = 1, limit = 10, classId, status } = {},
) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ["s.member_id = $1"];
  const values = [memberId];
  let paramIndex = 2;

  if (classId) {
    conditions.push(`a.class_id = $${paramIndex}`);
    values.push(classId);
    paramIndex++;
  }

  if (status === "graded") {
    conditions.push("s.score IS NOT NULL");
  } else if (status === "pending" || status === "ungraded") {
    conditions.push("s.score IS NULL");
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `
    SELECT COUNT(s.id)::int AS total
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN classes c ON c.id = a.class_id
    WHERE ${whereClause}
    `,
    values,
  );
  const total = countResult.rows[0]?.total || 0;

  const dataResult = await pool.query(
    `
    SELECT 
      s.id,
      s.assignment_id,
      s.member_id,
      s.content,
      s.repository_url,
      s.submitted_at,
      s.score,
      s.feedback,
      s.reviewed_by,
      s.reviewed_at,
      a.title AS assignment_title,
      a.deadline AS assignment_deadline,
      a.maximum_score AS assignment_maximum_score,
      c.id AS class_id,
      c.name AS class_name,
      u_reviewer.name AS reviewer_name,
      u_reviewer.email AS reviewer_email,
      ${ATTACHMENTS_SUBQUERY}
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN classes c ON c.id = a.class_id
    LEFT JOIN users u_reviewer ON u_reviewer.id = s.reviewed_by
    WHERE ${whereClause}
    ORDER BY s.submitted_at DESC, s.id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, parsedLimit, offset],
  );

  return {
    submissions: dataResult.rows.map(formatSubmissionWithAttachment),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const upsert = async ({
  assignmentId,
  memberId,
  content,
  repositoryUrl,
  uploadIds = [],
}) => {
  const insertResult = await pool.query(
    `
    INSERT INTO submissions (
      assignment_id,
      member_id,
      content,
      repository_url
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (assignment_id, member_id)
    DO UPDATE SET
      content = EXCLUDED.content,
      repository_url = EXCLUDED.repository_url,
      submitted_at = CURRENT_TIMESTAMP,
      score = NULL,
      feedback = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL
    RETURNING id
    `,
    [assignmentId, memberId, content ?? null, repositoryUrl ?? null],
  );

  const submissionId = insertResult.rows[0]?.id;

  if (submissionId && uploadIds && uploadIds.length > 0) {
    for (const uploadId of uploadIds) {
      await pool.query(
        `
        INSERT INTO submission_attachments (submission_id, upload_id)
        VALUES ($1, $2)
        ON CONFLICT (submission_id, upload_id) DO NOTHING
        `,
        [submissionId, uploadId],
      );
    }
  }

  return await findByAssignmentAndMember(assignmentId, memberId);
};

export const review = async (id, { score, feedback, reviewedBy }) => {
  const result = await pool.query(
    `
    UPDATE submissions
    SET 
      score = $1,
      feedback = $2,
      reviewed_by = $3,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
    `,
    [score, feedback ?? null, reviewedBy, id],
  );

  if (!result.rows[0]) return null;
  return await findById(id);
};
