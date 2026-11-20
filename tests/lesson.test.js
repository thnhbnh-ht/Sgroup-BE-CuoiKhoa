import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.config.js";
import { hashPassword } from "../src/utils/password.helper.js";

const TEST_TAG = "test.lesson.suite";
const adminUser = {
  name: "Test Lesson Admin",
  email: `admin.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const mentorUser = {
  name: "Test Lesson Mentor",
  email: `mentor.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const otherMentorUser = {
  name: "Test Lesson Other Mentor",
  email: `other.mentor.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const memberUser = {
  name: "Test Lesson Member",
  email: `member.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const outsiderUser = {
  name: "Test Lesson Outsider",
  email: `outsider.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};

const createTestUserWithRole = async ({ name, email, password, roleName }) => {
  const hashed = await hashPassword(password);
  const userRes = await pool.query(
    `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email
    `,
    [name, email, hashed],
  );
  const user = userRes.rows[0];

  const roleRes = await pool.query(`SELECT id FROM roles WHERE name = $1`, [
    roleName,
  ]);
  if (roleRes.rows[0]) {
    await pool.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [user.id, roleRes.rows[0].id],
    );
  }

  return user;
};

const loginAs = async ({ email, password }) => {
  const res = await request(app).post("/auth/login").send({ email, password });
  assert.equal(res.status, 200);
  return res.body.data.accessToken;
};

describe("Lesson API", () => {
  let adminToken;
  let mentorToken;
  let otherMentorToken;
  let memberToken;
  let outsiderToken;
  let mentorId;
  let memberId;
  let classId;
  let lesson1Id;
  let lesson2Id;

  before(async () => {
    await createTestUserWithRole({ ...adminUser, roleName: "ADMIN" });
    const mentor = await createTestUserWithRole({
      ...mentorUser,
      roleName: "MEMBER",
    });
    await createTestUserWithRole({
      ...otherMentorUser,
      roleName: "MEMBER",
    });
    const member = await createTestUserWithRole({
      ...memberUser,
      roleName: "MEMBER",
    });
    await createTestUserWithRole({ ...outsiderUser, roleName: "MEMBER" });

    mentorId = mentor.id;
    memberId = member.id;

    adminToken = await loginAs(adminUser);
    mentorToken = await loginAs(mentorUser);
    otherMentorToken = await loginAs(otherMentorUser);
    memberToken = await loginAs(memberUser);
    outsiderToken = await loginAs(outsiderUser);

    const classRes = await request(app)
      .post("/classes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Lesson Class",
        description: "Class for lesson test",
        startDate: "2026-11-01",
        endDate: "2026-12-20",
        mentorId,
      });

    assert.equal(classRes.status, 201);
    classId = classRes.body.data.id;

    const addMemberRes = await request(app)
      .post(`/classes/${classId}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ memberId });

    assert.equal(addMemberRes.status, 201);
  });

  after(async () => {
    if (classId) {
      await pool.query(`DELETE FROM classes WHERE id = $1`, [classId]);
    }
    await pool.query(`DELETE FROM users WHERE email LIKE $1`, [
      `%${TEST_TAG}%`,
    ]);
  });

  it("should allow mentor to create/update lessons and block member, other mentor, or outsider", async () => {
    const forbiddenCreateRes = await request(app)
      .post(`/classes/${classId}/lessons`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        title: "Forbidden Lesson",
        content: "Should fail",
        lessonOrder: 1,
      });

    assert.equal(forbiddenCreateRes.status, 403);

    const otherMentorCreateRes = await request(app)
      .post(`/classes/${classId}/lessons`)
      .set("Authorization", `Bearer ${otherMentorToken}`)
      .send({
        title: "Lesson by Other Mentor",
        content: "Should be forbidden",
        lessonOrder: 9,
      });

    assert.equal(otherMentorCreateRes.status, 403);

    const create1Res = await request(app)
      .post(`/classes/${classId}/lessons`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Lesson 1 - Intro",
        content: "Intro content",
        lessonOrder: 1,
      });

    assert.equal(create1Res.status, 201);
    lesson1Id = create1Res.body.data.id;

    const create2Res = await request(app)
      .post(`/classes/${classId}/lessons`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Lesson 2 - Deep Dive",
        content: "Deep dive content",
        lessonOrder: 2,
      });

    assert.equal(create2Res.status, 201);
    lesson2Id = create2Res.body.data.id;

    const otherMentorUpdateRes = await request(app)
      .patch(`/lessons/${lesson1Id}`)
      .set("Authorization", `Bearer ${otherMentorToken}`)
      .send({
        title: "Hacked Title",
      });

    assert.equal(otherMentorUpdateRes.status, 403);

    const updateRes = await request(app)
      .patch(`/lessons/${lesson1Id}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Lesson 1 - Updated",
        lessonOrder: 1,
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.title, "Lesson 1 - Updated");

    const outsiderViewRes = await request(app)
      .get(`/classes/${classId}/lessons`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    assert.equal(outsiderViewRes.status, 403);
  });

  it("should complete lesson once, prevent duplicate completion, and calculate class progress", async () => {
    const memberListRes = await request(app)
      .get(`/classes/${classId}/lessons`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(memberListRes.status, 200);
    assert.equal(memberListRes.body.data.length, 2);

    const completeRes = await request(app)
      .post(`/lessons/${lesson1Id}/complete`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(completeRes.status, 200);

    const duplicateCompleteRes = await request(app)
      .post(`/lessons/${lesson1Id}/complete`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(duplicateCompleteRes.status, 409);

    const progressRes = await request(app)
      .get(`/classes/${classId}/progress`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(progressRes.status, 200);
    assert.equal(progressRes.body.data.totalLessons, 2);
    assert.equal(progressRes.body.data.completedLessons, 1);
    assert.equal(progressRes.body.data.progress, 50);
  });

  it("should allow mentor to delete lesson", async () => {
    const deleteRes = await request(app)
      .delete(`/lessons/${lesson2Id}`)
      .set("Authorization", `Bearer ${mentorToken}`);

    assert.equal(deleteRes.status, 200);
  });
});