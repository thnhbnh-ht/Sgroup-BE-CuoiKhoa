-- Migration: 000_init_schema.sql
-- Description: Khởi tạo toàn bộ cấu trúc bảng và các quyền mặc định (permissions, roles)

-- 1. Bảng roles
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng permissions
CREATE TABLE IF NOT EXISTS permissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Bảng users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

-- 6. Bảng classes
CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  mentor_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_class_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- 7. Bảng class_members
CREATE TABLE IF NOT EXISTS class_members (
  class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, member_id)
);

-- 8. Bảng lessons
CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  lesson_order INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_lesson_order CHECK (lesson_order >= 0)
);

-- 9. Bảng lesson_progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_lp_lesson_member UNIQUE (lesson_id, member_id)
);

-- 10. Bảng assignments
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITHOUT TIME ZONE,
  maximum_score INTEGER NOT NULL DEFAULT 100,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_assignment_max_score CHECK (maximum_score > 0)
);

-- 11. Bảng submissions
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  repository_url VARCHAR(500),
  submitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score INTEGER,
  feedback TEXT,
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_submission_assignment_member UNIQUE (assignment_id, member_id),
  CONSTRAINT chk_sub_score CHECK (score IS NULL OR score >= 0)
);

-- 12. Bảng uploads
CREATE TABLE IF NOT EXISTS uploads (
  id BIGSERIAL PRIMARY KEY,
  uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key VARCHAR(500) NOT NULL UNIQUE,
  url VARCHAR(500) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_uploads_size CHECK (size > 0)
);

-- ============================================================
-- KHỞI TẠO DỮ LIỆU CỐT LÕI (ROLES & PERMISSIONS HỆ THỐNG)
-- ============================================================

-- Khởi tạo 2 roles mặc định
INSERT INTO roles (name, description) VALUES
  ('ADMIN', 'Quản trị viên, có toàn quyền'),
  ('MEMBER', 'Thành viên học viên')
ON CONFLICT (name) DO NOTHING;

-- Khởi tạo 24 permissions chuẩn của hệ thống
INSERT INTO permissions (name, description) VALUES
  ('USER_READ', 'Xem danh sách và thông tin user'),
  ('USER_CREATE', 'Tạo user mới'),
  ('USER_UPDATE', 'Cập nhật thông tin user'),
  ('USER_DELETE', 'Xóa user'),
  ('CLASS_READ', 'Xem class'),
  ('CLASS_CREATE', 'Tạo class mới'),
  ('CLASS_UPDATE', 'Cập nhật class'),
  ('CLASS_DELETE', 'Xóa class'),
  ('CLASS_MEMBER_ADD', 'Thêm member vào class'),
  ('CLASS_MEMBER_REMOVE', 'Xóa member khỏi class'),
  ('LESSON_READ', 'Xem lesson'),
  ('LESSON_CREATE', 'Tạo lesson'),
  ('LESSON_UPDATE', 'Cập nhật lesson'),
  ('LESSON_DELETE', 'Xóa lesson'),
  ('LESSON_COMPLETE', 'Đánh dấu lesson hoàn thành'),
  ('ASSIGNMENT_READ', 'Xem assignment'),
  ('ASSIGNMENT_CREATE', 'Tạo assignment'),
  ('ASSIGNMENT_UPDATE', 'Cập nhật assignment'),
  ('ASSIGNMENT_DELETE', 'Xóa assignment'),
  ('SUBMISSION_CREATE', 'Nộp bài (submit)'),
  ('SUBMISSION_READ_OWN', 'Xem submission của chính mình'),
  ('SUBMISSION_READ_ALL', 'Xem tất cả submission trong class'),
  ('SUBMISSION_REVIEW', 'Chấm điểm và viết feedback'),
  ('UPLOAD_CREATE', 'Upload file')
ON CONFLICT (name) DO NOTHING;

-- Gán toàn bộ 24 quyền cho role ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán các quyền cơ bản cho role MEMBER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'MEMBER'
  AND p.name IN (
    'ASSIGNMENT_READ',
    'CLASS_READ',
    'LESSON_COMPLETE',
    'LESSON_READ',
    'SUBMISSION_CREATE',
    'SUBMISSION_READ_OWN',
    'UPLOAD_CREATE'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
