import pool from "../config/db.config.js";
import { hashPassword } from "../utils/password.helper.js";

const SEED_USERS = [
  {
    name: "Admin S-Group",
    email: "admin@sgroup.local",
    password: "Password@123",
    roleName: "ADMIN",
  },
  {
    name: "Mentor Minh",
    email: "mentor.minh@sgroup.local",
    password: "Password@123",
    roleName: "MEMBER",
  },
  {
    name: "Member Lan",
    email: "member.lan@sgroup.local",
    password: "Password@123",
    roleName: "MEMBER",
  },
  {
    name: "Member Nam",
    email: "member.nam@sgroup.local",
    password: "Password@123",
    roleName: "MEMBER",
  },
];

const ensureUser = async (client, { name, email, password, roleName }) => {
  const existingResult = await client.query(
    `SELECT id, name, email FROM users WHERE email = $1`,
    [email],
  );

  let user = existingResult.rows[0];

  if (!user) {
    const hashedPassword = await hashPassword(password);
    const insertedResult = await client.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
      `,
      [name, email, hashedPassword],
    );
    user = insertedResult.rows[0];
  }

  const roleResult = await client.query(
    `SELECT id, name FROM roles WHERE name = $1`,
    [roleName],
  );

  if (!roleResult.rows[0]) {
    throw new Error(`Role not found: ${roleName}`);
  }

  await client.query(
    `
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [user.id, roleResult.rows[0].id],
  );

  return user;
};

const seedUsers = async (client) => {
  const usersByEmail = {};

  for (const item of SEED_USERS) {
    const user = await ensureUser(client, item);
    usersByEmail[item.email] = user;
  }

  return usersByEmail;
};

const ensureClass = async (
  client,
  { name, description, startDate, endDate, mentorId, createdBy },
) => {
  const existingResult = await client.query(
    `SELECT * FROM classes WHERE name = $1`,
    [name],
  );

  if (existingResult.rows[0]) {
    return existingResult.rows[0];
  }

  const insertedResult = await client.query(
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

  return insertedResult.rows[0];
};

const ensureClassMember = async (client, classId, memberId) => {
  await client.query(
    `
    INSERT INTO class_members (class_id, member_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [classId, memberId],
  );
};

const ensureLesson = async (
  client,
  { classId, title, content, lessonOrder, createdBy },
) => {
  const existingResult = await client.query(
    `SELECT * FROM lessons WHERE class_id = $1 AND title = $2`,
    [classId, title],
  );

  if (existingResult.rows[0]) {
    return existingResult.rows[0];
  }

  const insertedResult = await client.query(
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
    [classId, title, content ?? null, lessonOrder ?? 0, createdBy],
  );

  return insertedResult.rows[0];
};

const ensureLessonProgress = async (client, lessonId, memberId) => {
  await client.query(
    `
    INSERT INTO lesson_progress (lesson_id, member_id, completed_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    `,
    [lessonId, memberId],
  );
};

const ensureAssignment = async (
  client,
  { classId, title, description, deadline, maximumScore, createdBy },
) => {
  const existingResult = await client.query(
    `SELECT * FROM assignments WHERE class_id = $1 AND title = $2`,
    [classId, title],
  );

  if (existingResult.rows[0]) {
    return existingResult.rows[0];
  }

  const insertedResult = await client.query(
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
      description ?? null,
      deadline ?? null,
      maximumScore ?? 100,
      createdBy,
    ],
  );

  return insertedResult.rows[0];
};

const ensureSubmission = async (
  client,
  {
    assignmentId,
    memberId,
    content,
    repositoryUrl,
    score = null,
    feedback = null,
    reviewedBy = null,
  },
) => {
  const existingResult = await client.query(
    `
    SELECT * FROM submissions
    WHERE assignment_id = $1 AND member_id = $2
    `,
    [assignmentId, memberId],
  );

  if (existingResult.rows[0]) {
    return existingResult.rows[0];
  }

  const reviewedAt = score !== null && reviewedBy ? new Date() : null;

  const insertedResult = await client.query(
    `
    INSERT INTO submissions (
      assignment_id,
      member_id,
      content,
      repository_url,
      score,
      feedback,
      reviewed_by,
      reviewed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      assignmentId,
      memberId,
      content ?? null,
      repositoryUrl ?? null,
      score,
      feedback,
      reviewedBy,
      reviewedAt,
    ],
  );

  return insertedResult.rows[0];
};

const seedDomainData = async (client, usersByEmail) => {
  const adminId = usersByEmail["admin@sgroup.local"].id;
  const mentorId = usersByEmail["mentor.minh@sgroup.local"].id;
  const memberLanId = usersByEmail["member.lan@sgroup.local"].id;
  const memberNamId = usersByEmail["member.nam@sgroup.local"].id;

  const batch01 = await ensureClass(client, {
    name: "BE Basic - Batch 01",
    description: "Backend Basic course for S-Group members",
    startDate: "2026-09-01",
    endDate: "2026-12-15",
    mentorId,
    createdBy: adminId,
  });

  await ensureClassMember(client, batch01.id, memberLanId);
  await ensureClassMember(client, batch01.id, memberNamId);

  const lesson1 = await ensureLesson(client, {
    classId: batch01.id,
    title: "01. Backend Introduction",
    content: "Overview of client-server architecture and HTTP",
    lessonOrder: 1,
    createdBy: mentorId,
  });

  const lesson2 = await ensureLesson(client, {
    classId: batch01.id,
    title: "02. REST API & PostgreSQL",
    content: "Designing RESTful endpoints and relational schemas",
    lessonOrder: 2,
    createdBy: mentorId,
  });

  await ensureLessonProgress(client, lesson1.id, memberLanId);
  await ensureLessonProgress(client, lesson2.id, memberLanId);
  await ensureLessonProgress(client, lesson1.id, memberNamId);

  const assignment1 = await ensureAssignment(client, {
    classId: batch01.id,
    title: "Assignment 01 - CRUD API",
    description: "Build CRUD endpoints with validation and error handling",
    deadline: "2026-12-01T23:59:59.000Z",
    maximumScore: 100,
    createdBy: mentorId,
  });

  await ensureSubmission(client, {
    assignmentId: assignment1.id,
    memberId: memberLanId,
    content: "Completed CRUD API with PostgreSQL",
    repositoryUrl: "https://github.com/sgroup/be-basic-assignment-01-lan",
    score: 95,
    feedback: "Clean structure and good error handling",
    reviewedBy: mentorId,
  });

  await ensureSubmission(client, {
    assignmentId: assignment1.id,
    memberId: memberNamId,
    content: "Submitted assignment 01",
    repositoryUrl: "https://github.com/sgroup/be-basic-assignment-01-nam",
  });
};

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const usersByEmail = await seedUsers(client);
    await seedDomainData(client, usersByEmail);

    await client.query("COMMIT");
    console.log("Seed completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();