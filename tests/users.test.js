import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.config.js";
import { hashPassword } from "../src/utils/password.helper.js";

const TEST_TAG = "test.users.suite";
const adminUser = {
  name: "Test Users Admin",
  email: `admin.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const memberUser = {
  name: "Test Users Member",
  email: `member.${TEST_TAG}@sgroup.local`,
  password: "Password@123",
};
const targetUser = {
  name: "Target User",
  email: `target.${TEST_TAG}@sgroup.local`,
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

describe("Users API", () => {
  let adminToken;
  let memberToken;
  let createdTarget;

  before(async () => {
    await createTestUserWithRole({ ...adminUser, roleName: "ADMIN" });
    await createTestUserWithRole({ ...memberUser, roleName: "MEMBER" });
    createdTarget = await createTestUserWithRole({
      ...targetUser,
      roleName: "MEMBER",
    });

    adminToken = await loginAs(adminUser);
    memberToken = await loginAs(memberUser);
  });

  after(async () => {
    await pool.query(`DELETE FROM users WHERE email LIKE $1`, [
      `%${TEST_TAG}%`,
    ]);
  });

  it("should block non-admin from listing or deleting users", async () => {
    const listRes = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(listRes.status, 403);

    const deleteRes = await request(app)
      .delete(`/users/${createdTarget.id}`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.equal(deleteRes.status, 403);
  });

  it("should allow admin to list, update, and return 404 for missing user", async () => {
    const listRes = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(listRes.status, 200);
    const users = listRes.body.data.users || listRes.body.data;
    assert.ok(Array.isArray(users));

    const updateRes = await request(app)
      .patch(`/users/${createdTarget.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Target Name" });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, "Updated Target Name");

    const notFoundRes = await request(app)
      .get("/users/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(notFoundRes.status, 404);
  });
});