import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.config.js";
import { hashPassword } from "../src/utils/password.helper.js";

const TEST_TAG = "test.assignment.suite";
const adminUser = {
  name: "Test Assignment Admin",
  email: `admin.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const mentorUser = {
  name: "Test Assignment Mentor",
  email: `mentor.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const otherMentorUser = {
  name: "Test Assignment Other Mentor",
  email: `other.mentor.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const memberUser = {
  name: "Test Assignment Member",
  email: `member.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const outsiderUser = {
  name: "Test Assignment Outsider",
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

describe("Assignment API", () => {
  let adminToken;
  let mentorToken;
  let otherMentorToken;
  let memberToken;
  let outsiderToken;
  let mentorId;
  let memberId;
  let classId;
  let assignmentId;

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
        name: "Test Assignment Class",
        description: "Class for assignment test",
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

  it("should allow mentor to create/update assignment and block member, other mentor, or outsider", async () => {
    const forbiddenCreateRes = await request(app)
      .post(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        title: "Forbidden Assignment",
        description: "Should fail",
        deadline: "2026-12-10T23:59:59Z",
        maximumScore: 100,
      });

    assert.equal(forbiddenCreateRes.status, 403);

    const otherMentorCreateRes = await request(app)
      .post(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${otherMentorToken}`)
      .send({
        title: "Assignment by Other Mentor",
        description: "Should be forbidden",
        deadline: "2026-12-10T23:59:59Z",
        maximumScore: 100,
      });

    assert.equal(otherMentorCreateRes.status, 403);

    const createRes = await request(app)
      .post(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Assignment 01 - REST API",
        description: "Build CRUD endpoints",
        deadline: "2026-12-10T23:59:59Z",
        maximumScore: 100,
      });

    assert.equal(createRes.status, 201);
    assignmentId = createRes.body.data.id;
    assert.ok(assignmentId);

    const otherMentorUpdateRes = await request(app)
      .patch(`/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${otherMentorToken}`)
      .send({
        title: "Hacked Assignment",
      });

    assert.equal(otherMentorUpdateRes.status, 403);

    const updateRes = await request(app)
      .patch(`/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Assignment 01 - Updated",
        maximumScore: 80,
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.title, "Assignment 01 - Updated");
    assert.equal(Number(updateRes.body.data.maximum_score), 80);

    const outsiderViewRes = await request(app)
      .get(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    assert.equal(outsiderViewRes.status, 403);
  });

  it("should allow class member to list and view assignment details", async () => {
    const listRes = await request(app)
      .get(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.length, 1);

    const detailRes = await request(app)
      .get(`/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(detailRes.status, 200);
    assert.equal(Number(detailRes.body.data.id), Number(assignmentId));
  });

  it("should allow mentor to delete assignment", async () => {
    const deleteRes = await request(app)
      .delete(`/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${mentorToken}`);

    assert.equal(deleteRes.status, 200);
  });
});