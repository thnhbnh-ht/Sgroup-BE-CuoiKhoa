import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.config.js";

const testUser = {
  name: "Test Auth User",
  email: "test.auth.user@sgroup.local",
  password: "Password@123",
};

describe("Auth API", () => {
  after(async () => {
    await pool.query(`DELETE FROM users WHERE email = $1`, [testUser.email]);
  });

  it("should register a new user and reject duplicate email", async () => {
    const createRes = await request(app)
      .post("/auth/register")
      .send(testUser);

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.email, testUser.email);

    const duplicateRes = await request(app)
      .post("/auth/register")
      .send(testUser);

    assert.equal(duplicateRes.status, 409);
  });

  it("should login with valid credentials and fetch current profile", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.data.accessToken);

    const meRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.email, testUser.email);
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword@123",
      });

    assert.equal(res.status, 401);
  });
  it("should reject login with missing password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
    });

    assert.equal(res.status, 400);
  });
});