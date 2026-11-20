import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.config.js";
import { hashPassword } from "../src/utils/password.helper.js";

const TEST_TAG = "test.submission.suite";
const adminUser = {
  name: "Test Submission Admin",
  email: `admin.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const mentorUser = {
  name: "Test Submission Mentor",
  email: `mentor.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const otherMentorUser = {
  name: "Test Submission Other Mentor",
  email: `other.mentor.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const memberUser = {
  name: "Test Submission Member",
  email: `member.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const outsiderUser = {
  name: "Test Submission Outsider",
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

describe("Submission API", () => {
  let adminToken;
  let mentorToken;
  let otherMentorToken;
  let memberToken;
  let outsiderToken;
  let mentorId;
  let memberId;
  let classId;
  let openAssignmentId;
  let expiredAssignmentId;
  let submissionId;

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
        name: "Test Submission Class",
        description: "Class for submission test",
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

    const openAssignmentRes = await request(app)
      .post(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Open Assignment",
        description: "Still open",
        deadline: "2026-12-30T23:59:59.000Z",
        maximumScore: 100,
      });

    assert.equal(openAssignmentRes.status, 201);
    openAssignmentId = openAssignmentRes.body.data.id;

    const expiredAssignmentRes = await request(app)
      .post(`/classes/${classId}/assignments`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Expired Assignment",
        description: "Deadline passed",
        deadline: "2020-01-01T00:00:00.000Z",
        maximumScore: 100,
      });

    assert.equal(expiredAssignmentRes.status, 201);
    expiredAssignmentId = expiredAssignmentRes.body.data.id;
  });

  after(async () => {
    if (classId) {
      await pool.query(`DELETE FROM classes WHERE id = $1`, [classId]);
    }
    await pool.query(`DELETE FROM users WHERE email LIKE $1`, [
      `%${TEST_TAG}%`,
    ]);
  });

  it("should allow class member to submit before deadline and block non-members or expired deadline", async () => {
    const outsiderSubmitRes = await request(app)
      .post(`/assignments/${openAssignmentId}/submissions`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({
        content: "Outsider try",
        repositoryUrl: "https://github.com/test/outsider",
      });

    assert.equal(outsiderSubmitRes.status, 403);

    const expiredSubmitRes = await request(app)
      .post(`/assignments/${expiredAssignmentId}/submissions`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        content: "Late submission",
        repositoryUrl: "https://github.com/test/late",
      });

    assert.equal(expiredSubmitRes.status, 400);

    const submitRes = await request(app)
      .post(`/assignments/${openAssignmentId}/submissions`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        content: "First submission",
        repositoryUrl: "https://github.com/test/submission-v1",
      });

    assert.equal(submitRes.status, 201);
    submissionId = submitRes.body.data.id;
    assert.ok(submissionId);

    const mySubRes = await request(app)
      .get(`/assignments/${openAssignmentId}/submissions/me`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(mySubRes.status, 200);
    assert.equal(
      mySubRes.body.data.repository_url,
      "https://github.com/test/submission-v1",
    );
  });

  it("should enforce review permissions, score bounds, and negative score", async () => {
    const memberReviewRes = await request(app)
      .patch(`/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        score: 90,
        feedback: "Self review should fail",
      });

    assert.equal(memberReviewRes.status, 403);

    const otherMentorReviewRes = await request(app)
      .patch(`/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${otherMentorToken}`)
      .send({
        score: 80,
        feedback: "Wrong mentor should fail",
      });

    assert.equal(otherMentorReviewRes.status, 403);

    const negativeScoreRes = await request(app)
      .patch(`/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        score: -5,
        feedback: "Negative score invalid",
      });

    assert.equal(negativeScoreRes.status, 400);

    const overScoreRes = await request(app)
      .patch(`/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        score: 150,
        feedback: "Exceeds max score",
      });

    assert.equal(overScoreRes.status, 400);

    const validReviewRes = await request(app)
      .patch(`/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        score: 95,
        feedback: "Solid implementation",
      });

    assert.equal(validReviewRes.status, 200);
    assert.equal(Number(validReviewRes.body.data.score), 95);

    const listRes = await request(app)
      .get(`/assignments/${openAssignmentId}/submissions`)
      .set("Authorization", `Bearer ${mentorToken}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.submissions.length, 1);
  });

  it("should reset score and feedback when member resubmits before deadline", async () => {
    const resubmitRes = await request(app)
      .post(`/assignments/${openAssignmentId}/submissions`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        content: "Updated submission v2",
        repositoryUrl: "https://github.com/test/submission-v2",
      });

    assert.equal(resubmitRes.status, 201);
    assert.equal(
      resubmitRes.body.data.repository_url,
      "https://github.com/test/submission-v2",
    );
    assert.equal(resubmitRes.body.data.score, null);
    assert.equal(resubmitRes.body.data.feedback, null);
  });
});