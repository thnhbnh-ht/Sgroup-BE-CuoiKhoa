import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.config.js";
import { hashPassword } from "../src/utils/password.helper.js";

const TEST_TAG = "test.class.suite";
const adminUser = {
  name: "Test Class Admin",
  email: `admin.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const memberA = {
  name: "Test Class Member A",
  email: `member.a.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const memberB = {
  name: "Test Class Member B",
  email: `member.b.${TEST_TAG}@sgroup.local`,
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

describe("Class API", () => {
  let adminToken;
  let memberAToken;
  let memberBToken;
  let createdMemberA;
  let createdMemberB;
  let createdClassId;

  before(async () => {
    await createTestUserWithRole({ ...adminUser, roleName: "ADMIN" });
    createdMemberA = await createTestUserWithRole({
      ...memberA,
      roleName: "MEMBER",
    });
    createdMemberB = await createTestUserWithRole({
      ...memberB,
      roleName: "MEMBER",
    });

    adminToken = await loginAs(adminUser);
    memberAToken = await loginAs(memberA);
    memberBToken = await loginAs(memberB);
  });

  after(async () => {
    if (createdClassId) {
      await pool.query(`DELETE FROM classes WHERE id = $1`, [createdClassId]);
    }
    await pool.query(`DELETE FROM users WHERE email LIKE $1`, [
      `%${TEST_TAG}%`,
    ]);
  });

  it("should allow admin to create, update, assign mentor, and fetch class", async () => {
    const createRes = await request(app)
      .post("/classes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test NodeJS Class",
        description: "Class for automated test",
        startDate: "2026-11-01",
        endDate: "2026-12-20",
      });

    assert.equal(createRes.status, 201);
    createdClassId = createRes.body.data.id;
    assert.ok(createdClassId);

    const mentorRes = await request(app)
      .patch(`/classes/${createdClassId}/mentor`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mentorId: createdMemberA.id });

    assert.equal(mentorRes.status, 200);
    assert.equal(Number(mentorRes.body.data.mentor_id), Number(createdMemberA.id));

    const detailRes = await request(app)
      .get(`/classes/${createdClassId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.data.name, "Test NodeJS Class");
  });

  it("should enforce class membership access and prevent duplicate member", async () => {
    const forbiddenRes = await request(app)
      .get(`/classes/${createdClassId}`)
      .set("Authorization", `Bearer ${memberBToken}`);

    assert.equal(forbiddenRes.status, 403);

    const addRes = await request(app)
      .post(`/classes/${createdClassId}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ memberId: createdMemberB.id });

    assert.equal(addRes.status, 201);

    const duplicateRes = await request(app)
      .post(`/classes/${createdClassId}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ memberId: createdMemberB.id });

    assert.equal(duplicateRes.status, 409);

    const allowedRes = await request(app)
      .get(`/classes/${createdClassId}`)
      .set("Authorization", `Bearer ${memberBToken}`);

    assert.equal(allowedRes.status, 200);

    const memberClassesRes = await request(app)
      .get("/classes")
      .set("Authorization", `Bearer ${memberAToken}`);

    assert.equal(memberClassesRes.status, 200);
  });

  it("should remove member and delete class cleanly", async () => {
    const removeRes = await request(app)
      .delete(`/classes/${createdClassId}/members/${createdMemberB.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(removeRes.status, 200);

    const removeAgainRes = await request(app)
      .delete(`/classes/${createdClassId}/members/${createdMemberB.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(removeAgainRes.status, 409);

    const deleteRes = await request(app)
      .delete(`/classes/${createdClassId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(deleteRes.status, 200);
    createdClassId = null;
  });
  it("should reject updating class with disallowed fields", async () => {
    const createRes = await request(app)
      .post("/classes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Temp Class For Validation",
        description: "Validation check",
      });

    assert.equal(createRes.status, 201);
    const tempClassId = createRes.body.data.id;

    const invalidUpdateRes = await request(app)
      .patch(`/classes/${tempClassId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Name",
        unknownField: "not allowed",
      });

    assert.equal(invalidUpdateRes.status, 400);

    await pool.query(`DELETE FROM classes WHERE id = $1`, [tempClassId]);
  });
});