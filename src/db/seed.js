import pool from "../config/db.config.js";
import { hashPassword } from "../utils/password.helper.js";

// ============================================================
// 1. DANH SÁCH USERS: 1 ADMIN, 10 MENTORS, 30 MEMBERS
// ============================================================

const ADMIN_USER = {
  name: "Admin S-Group",
  email: "admin@sgroup.vn",
  password: "Password@123",
  roleName: "ADMIN",
};

const MENTORS = [
  { name: "Nguyễn Hữu Khôi", email: "nguyenhuukhoi@gmail.com" },
  { name: "Nguyễn Việt Trung", email: "nguyenviettrung@gmail.com" },
  { name: "Trần Minh Quang", email: "tranminhquang@gmail.com" },
  { name: "Lê Hoàng Long", email: "lehoanglong@gmail.com" },
  { name: "Phạm Đức Thắng", email: "phamducthang@gmail.com" },
  { name: "Vũ Hải Đăng", email: "vuhaidang@gmail.com" },
  { name: "Đặng Quốc Huy", email: "dangquochuy@gmail.com" },
  { name: "Bùi Anh Tuấn", email: "buianhtuan@gmail.com" },
  { name: "Đỗ Minh Đức", email: "dominhduc@gmail.com" },
  { name: "Hoàng Trọng Nghĩa", email: "hoangtrongnghia@gmail.com" },
].map((m) => ({ ...m, password: "Password@123", roleName: "MEMBER" }));

const MEMBERS = [
  { name: "Mai Phúc Thịnh", email: "phucthinh@gmail.com" },
  { name: "Nguyễn Thanh Bình", email: "thanhbinh@gmail.com" },
  { name: "Trần Thị Mai Lan", email: "mailan@gmail.com" },
  { name: "Lê Văn Nam", email: "vannam@gmail.com" },
  { name: "Phạm Thị Hương", email: "huongpham@gmail.com" },
  { name: "Hoàng Văn Tuấn", email: "tuanhoang@gmail.com" },
  { name: "Vũ Minh Anh", email: "minhanh@gmail.com" },
  { name: "Đặng Thu Hà", email: "thuha@gmail.com" },
  { name: "Bùi Quốc Bảo", email: "quocbao@gmail.com" },
  { name: "Đỗ Phương Thảo", email: "phuongthao@gmail.com" },
  { name: "Ngô Gia Huy", email: "giahuy@gmail.com" },
  { name: "Dương Ngọc Ánh", email: "ngocanh@gmail.com" },
  { name: "Lý Hoàng Nam", email: "hoangnam@gmail.com" },
  { name: "Trịnh Công Sơn", email: "congson@gmail.com" },
  { name: "Đinh Tiến Dũng", email: "tiendung@gmail.com" },
  { name: "Hồ Quang Hiếu", email: "quanghieu@gmail.com" },
  { name: "Phan Mạnh Quỳnh", email: "manhquynh@gmail.com" },
  { name: "Võ Văn Kiệt", email: "vankiet@gmail.com" },
  { name: "Nguyễn Thị Kim Ngân", email: "kimngan@gmail.com" },
  { name: "Trần Đình Trọng", email: "dinhtrong@gmail.com" },
  { name: "Lê Công Vinh", email: "congvinh@gmail.com" },
  { name: "Phạm Văn Quyến", email: "vanquyen@gmail.com" },
  { name: "Nguyễn Quang Hải", email: "quanghai@gmail.com" },
  { name: "Đoàn Văn Hậu", email: "vanhau@gmail.com" },
  { name: "Bùi Tiến Dũng", email: "tiendung.bui@gmail.com" },
  { name: "Lương Xuân Trường", email: "xuantruong@gmail.com" },
  { name: "Nguyễn Công Phượng", email: "congphuong@gmail.com" },
  { name: "Nguyễn Văn Toàn", email: "vantoan@gmail.com" },
  { name: "Phan Văn Đức", email: "vanduc@gmail.com" },
  { name: "Hà Đức Chinh", email: "ducchinh@gmail.com" },
].map((m) => ({ ...m, password: "Password@123", roleName: "MEMBER" }));

// ============================================================
// 2. CÁC HÀM TIỆN ÍCH SEED AN TOÀN (IDEMPOTENT)
// ============================================================

const ensureUser = async (
  client,
  { name, email, password, roleName },
  sharedHashedPassword,
) => {
  const existingResult = await client.query(
    `SELECT id, name, email FROM users WHERE email = $1`,
    [email],
  );

  let user = existingResult.rows[0];

  if (!user) {
    const insertedResult = await client.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
      `,
      [name, email, sharedHashedPassword],
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
    ON CONFLICT (user_id, role_id) DO NOTHING
    `,
    [user.id, roleResult.rows[0].id],
  );

  return user;
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
    ON CONFLICT (class_id, member_id) DO NOTHING
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
    ON CONFLICT (lesson_id, member_id) DO NOTHING
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

const ensureUpload = async (
  client,
  { originalName, mimeType, size, objectKey, url, uploadedBy },
) => {
  const existing = await client.query(`SELECT * FROM uploads WHERE url = $1`, [
    url,
  ]);
  if (existing.rows[0]) return existing.rows[0];

  const inserted = await client.query(
    `
    INSERT INTO uploads (original_name, mime_type, size, object_key, url, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [originalName, mimeType, size, objectKey, url, uploadedBy],
  );
  return inserted.rows[0];
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

const ensureSubmissionAttachment = async (client, submissionId, uploadId) => {
  await client.query(
    `
    INSERT INTO submission_attachments (submission_id, upload_id)
    VALUES ($1, $2)
    ON CONFLICT (submission_id, upload_id) DO NOTHING
    `,
    [submissionId, uploadId],
  );
};

// ============================================================
// 3. SEED DỮ LIỆU CHÍNH
// ============================================================

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu phong phú...");

    // 1. Hash password 1 lần dùng chung để seed nhanh
    const sharedHashedPassword = await hashPassword("Password@123");

    // 2. Tạo 1 Admin
    const admin = await ensureUser(client, ADMIN_USER, sharedHashedPassword);
    console.log(`✅ Tạo Admin: ${admin.name} (${admin.email})`);

    // 3. Tạo 10 Mentors
    const mentorMap = {};
    for (const m of MENTORS) {
      const u = await ensureUser(client, m, sharedHashedPassword);
      mentorMap[m.email] = u;
    }
    console.log(
      `✅ Tạo thành công 10 Mentors: Nguyễn Hữu Khôi, Nguyễn Việt Trung, ...`,
    );

    // 4. Tạo 30 Members
    const membersList = [];
    for (const m of MEMBERS) {
      const u = await ensureUser(client, m, sharedHashedPassword);
      membersList.push(u);
    }
    console.log(
      `✅ Tạo thành công 30 Members (${membersList.length} học viên)`,
    );

    // 5. Tạo 5 Lớp học (mỗi lớp 10 học viên)
    // Chia nhóm 10 học viên cho từng lớp
    const group1 = membersList.slice(0, 10); // Học viên 1 -> 10
    const group2 = membersList.slice(10, 20); // Học viên 11 -> 20
    const group3 = membersList.slice(20, 30); // Học viên 21 -> 30
    const group4 = [
      membersList[0],
      membersList[2],
      membersList[4],
      membersList[6],
      membersList[8],
      membersList[10],
      membersList[12],
      membersList[14],
      membersList[16],
      membersList[18],
    ];
    const group5 = [
      membersList[1],
      membersList[3],
      membersList[5],
      membersList[7],
      membersList[9],
      membersList[11],
      membersList[13],
      membersList[15],
      membersList[17],
      membersList[19],
    ];

    const CLASSES_CONFIG = [
      {
        name: "Lập trình Backend Node.js K10",
        description:
          "Khóa đào tạo chuyên sâu Express.js, PostgreSQL, JWT và Cloudflare R2",
        startDate: "2026-09-01",
        endDate: "2026-12-30", // ongoing
        mentor: mentorMap["nguyenhuukhoi@gmail.com"],
        members: group1,
      },
      {
        name: "Lập trình Frontend ReactJS Chuyên Sâu",
        description: "Khóa học React 19, Redux Toolkit, TailwindCSS và Next.js",
        startDate: "2026-10-01",
        endDate: "2026-12-25", // ongoing
        mentor: mentorMap["nguyenviettrung@gmail.com"],
        members: group2,
      },
      {
        name: "Lập trình Web Fullstack JavaScript 2026",
        description:
          "Khóa học toàn diện từ Frontend đến Backend và triển khai CI/CD",
        startDate: "2026-05-01",
        endDate: "2026-08-30", // completed
        mentor: mentorMap["tranminhquang@gmail.com"],
        members: group3,
      },
      {
        name: "Kiến trúc Cơ sở dữ liệu & PostgreSQL Nâng Cao",
        description:
          "Tối ưu hóa Index, Query Plan, Partitioning và Transactions",
        startDate: "2026-12-15",
        endDate: "2027-02-28", // upcoming
        mentor: mentorMap["lehoanglong@gmail.com"],
        members: group4,
      },
      {
        name: "Docker, Kubernetes & Microservices Thực Chiến",
        description:
          "Container hóa ứng dụng, xây dựng kiến trúc Microservices và API Gateway",
        startDate: "2026-12-20",
        endDate: "2027-03-30", // upcoming
        mentor: mentorMap["phamducthang@gmail.com"],
        members: group5,
      },
    ];

    console.log("📚 Bắt đầu tạo 5 lớp học, bài học, bài tập và nộp bài...");

    for (const classConf of CLASSES_CONFIG) {
      const cls = await ensureClass(client, {
        name: classConf.name,
        description: classConf.description,
        startDate: classConf.startDate,
        endDate: classConf.endDate,
        mentorId: classConf.mentor.id,
        createdBy: admin.id,
      });

      // Thêm 10 members vào lớp
      for (const student of classConf.members) {
        await ensureClassMember(client, cls.id, student.id);
      }

      // Tạo 5 bài học cho mỗi lớp
      const lessons = [];
      const lessonTitles = [
        "01. Tổng quan kiến trúc & Cài đặt môi trường",
        "02. Thiết kế Cơ sở dữ liệu quan hệ & Mô hình hóa",
        "03. Xây dựng RESTful API và Xử lý lỗi",
        "04. Cơ chế Bảo mật Xác thực JWT & Phân quyền RBAC",
        "05. Tối ưu hiệu năng, Đóng gói Docker & Triển khai",
      ];

      for (let i = 0; i < lessonTitles.length; i++) {
        const les = await ensureLesson(client, {
          classId: cls.id,
          title: lessonTitles[i],
          content: `Nội dung chi tiết bài học: ${lessonTitles[i]}. Bao gồm lý thuyết cốt lõi, slide bài giảng và mã nguồn demo thực hành.`,
          lessonOrder: i + 1,
          createdBy: classConf.mentor.id,
        });
        lessons.push(les);
      }

      // Đánh dấu tiến độ học tập cho các học viên
      for (const student of classConf.members.slice(0, 6)) {
        await ensureLessonProgress(client, lessons[0].id, student.id);
        await ensureLessonProgress(client, lessons[1].id, student.id);
      }
      for (const student of classConf.members.slice(0, 3)) {
        await ensureLessonProgress(client, lessons[2].id, student.id);
      }

      // Tạo 2 bài tập cho mỗi lớp: 1 bài đã chấm điểm (có score), 1 bài đang mở
      const assign1 = await ensureAssignment(client, {
        classId: cls.id,
        title: "Bài tập 01: Xây dựng CRUD API với PostgreSQL",
        description:
          "Yêu cầu đầy đủ validation, mã hóa password, phân quyền và bắt lỗi chi tiết.",
        deadline: "2026-11-15T23:59:59.000Z",
        maximumScore: 100,
        createdBy: classConf.mentor.id,
      });

      const assign2 = await ensureAssignment(client, {
        classId: cls.id,
        title: "Đồ án giữa khóa: Tích hợp Upload File và Phân trang",
        description:
          "Hỗ trợ nộp nhiều file đính kèm, phân trang query params, kiểm thử tích hợp.",
        deadline: "2026-12-25T23:59:59.000Z",
        maximumScore: 100,
        createdBy: classConf.mentor.id,
      });

      // Tạo bài nộp phong phú (Submissions, Uploads, Attachments và Review)
      // Học viên 1 nộp bài tập 1 (Đã chấm điểm 95đ + Feedback + File đính kèm)
      const student1 = classConf.members[0];
      const upload1 = await ensureUpload(client, {
        originalName: "bao-cao-assignment-01.pdf",
        mimeType: "application/pdf",
        size: 1048576,
        objectKey: `submissions/seed-report-${cls.id}-1.pdf`,
        url: `https://pub-5506952c8c9942459295e4787dca9e5a.r2.dev/submissions/seed-report-${cls.id}-1.pdf`,
        uploadedBy: student1.id,
      });

      const sub1 = await ensureSubmission(client, {
        assignmentId: assign1.id,
        memberId: student1.id,
        content: `Em xin phép gửi bài tập 01 của lớp ${classConf.name}. Em đã viết đầy đủ mã nguồn và tài liệu API.`,
        repositoryUrl: `https://github.com/${student1.email.split("@")[0]}/assignment-01`,
        score: 95,
        feedback:
          "Code rất sạch đẹp, cấu trúc 3 lớp rõ ràng, validation và xử lý lỗi chặt chẽ. Rất tốt!",
        reviewedBy: classConf.mentor.id,
      });
      await ensureSubmissionAttachment(client, sub1.id, upload1.id);

      // Học viên 2 nộp bài tập 1 (Đã chấm 85đ)
      const student2 = classConf.members[1];
      await ensureSubmission(client, {
        assignmentId: assign1.id,
        memberId: student2.id,
        content: "Em nộp bài tập 1 ạ, đã test trên Postman hoạt động tốt.",
        repositoryUrl: `https://github.com/${student2.email.split("@")[0]}/assignment-01`,
        score: 85,
        feedback: "Làm tốt, chú ý thêm validate cho các trường số nguyên.",
        reviewedBy: classConf.mentor.id,
      });

      // Học viên 3 nộp bài tập 1 (Đang chờ chấm - Pending / Ungraded)
      const student3 = classConf.members[2];
      await ensureSubmission(client, {
        assignmentId: assign1.id,
        memberId: student3.id,
        content: "Em nộp bài tập vừa hoàn thành trước hạn nộp.",
        repositoryUrl: `https://github.com/${student3.email.split("@")[0]}/assignment-01`,
        score: null,
        feedback: null,
      });

      // Học viên 4 nộp bài tập 2 (Đang chờ chấm - Pending / Ungraded + File đính kèm ZIP)
      const student4 = classConf.members[3];
      const upload2 = await ensureUpload(client, {
        originalName: "source-code-do-an.zip",
        mimeType: "application/zip",
        size: 5242880,
        objectKey: `submissions/seed-code-${cls.id}-4.zip`,
        url: `https://pub-5506952c8c9942459295e4787dca9e5a.r2.dev/submissions/seed-code-${cls.id}-4.zip`,
        uploadedBy: student4.id,
      });

      const sub2 = await ensureSubmission(client, {
        assignmentId: assign2.id,
        memberId: student4.id,
        content: "Em nộp đồ án giữa khóa kèm file zip và link github.",
        repositoryUrl: `https://github.com/${student4.email.split("@")[0]}/midterm-project`,
        score: null,
        feedback: null,
      });
      await ensureSubmissionAttachment(client, sub2.id, upload2.id);
    }

    await client.query("COMMIT");
    console.log("🎉🎉🎉 SEED TOÀN BỘ DỮ LIỆU THÀNH CÔNG RỰC RỠ!");
    console.log("------------------------------------------------------------");
    console.log("📊 TỔNG KẾT DỮ LIỆU ĐÃ NẠP:");
    console.log(
      "  - 1 Tài khoản Admin: admin@sgroup.local (Mật khẩu: Password@123)",
    );
    console.log(
      "  - 10 Tài khoản Mentor: nguyenhuukhoi@gmail.com, nguyenviettrung@gmail.com,...",
    );
    console.log(
      "  - 30 Tài khoản Học viên (Member): phucthinh@gmail.com, thanhbinh@gmail.com,...",
    );
    console.log(
      "  - 5 Lớp học (Mỗi lớp có đúng 10 học viên, đầy đủ các trạng thái ongoing, upcoming, completed)",
    );
    console.log("  - 25 Bài học (Lessons)");
    console.log("  - 10 Bài tập (Assignments)");
    console.log(
      "  - 20 Bài nộp (Submissions: có cả bài đã chấm có điểm/feedback, bài chờ chấm, file đính kèm R2)",
    );
    console.log("------------------------------------------------------------");
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
