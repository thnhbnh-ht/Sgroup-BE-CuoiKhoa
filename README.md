# S-Group Learning Platform - Backend API

Hệ thống Backend phục vụ nền tảng quản lý đào tạo S-Group, cung cấp API quản lý lớp học, bài học, tiến độ học tập, bài tập, chấm điểm và nộp bài với hệ thống phân quyền theo vai trò (RBAC).

## 1. Công nghệ sử dụng

- Môi trường chạy: Node.js (v20+, ES Modules)
- Framework: Express.js (v5)
- Cơ sở dữ liệu: PostgreSQL 16 (kết nối qua thư viện pg, Repository Pattern với Raw SQL)
- Xác thực & Phân quyền: JWT (Access Token, Refresh Token), Bcrypt, RBAC (Role-Based Access Control)
- Quản lý tải tệp: Multer, AWS SDK v3 kết nối Cloudflare R2 / S3
- Đóng gói & Triển khai: Docker, Docker Compose
- Kiểm thử: Node.js Test Runner (node --test), Supertest

## 2. Cấu trúc thư mục

```text
.
├── docs/                 # Tài liệu API, Docker và tài liệu dự án
├── migrations/           # File kịch bản SQL khởi tạo schema cơ sở dữ liệu
├── src/
│   ├── config/           # Cấu hình Database và biến môi trường
│   ├── constants/        # Hằng số hệ thống và danh sách permissions
│   ├── controller/       # Tầng tiếp nhận request và trả lời lời gọi API
│   ├── core/             # Định nghĩa mã lỗi HTTP và lớp xử lý phản hồi
│   ├── db/               # Kịch bản chạy migration, reset và seed dữ liệu
│   ├── middleware/       # Middleware xác thực, phân quyền, upload, validate
│   ├── repository/       # Tầng truy vấn trực tiếp cơ sở dữ liệu (Raw SQL)
│   ├── route/            # Định tuyến API
│   ├── service/          # Tầng xử lý nghiệp vụ (Business Logic)
│   ├── utils/            # Hàm tiện ích (JWT, mã hóa mật khẩu, format dữ liệu)
│   ├── app.js            # Khởi tạo và cấu hình ứng dụng Express
│   └── index.js          # Điểm khởi chạy server
├── tests/                # Bộ kiểm thử tích hợp (Integration Tests)
├── .env.example          # Mẫu cấu hình biến môi trường
├── docker-compose.yml    # Cấu hình Docker Compose cho PostgreSQL và App
├── Dockerfile            # Cấu hình đóng gói container ứng dụng
└── package.json          # Quản lý dependencies và scripts
```

## 3. Các tính năng chính

- Xác thực & Phân quyền:
  - Đăng ký, đăng nhập, cấp mới token qua refresh token, đăng xuất.
  - Phân quyền theo vai trò (ADMIN, MEMBER) kết hợp kiểm tra quyền Mentor của lớp.
- Quản lý người dùng:
  - Xem danh sách, tạo mới, cập nhật thông tin và phân vai trò người dùng.
- Quản lý lớp học:
  - Tạo, cập nhật, xóa lớp học, chỉ định Mentor phụ trách, thêm/xóa học viên vào lớp.
- Quản lý bài học & Tiến độ:
  - Tạo bài học theo thứ tự trong lớp, cập nhật nội dung bài học.
  - Học viên đánh dấu hoàn thành và theo dõi tiến độ học tập theo từng lớp.
- Quản lý bài tập & Nộp bài:
  - Tạo bài tập có hạn nộp và điểm tối đa.
  - Học viên nộp bài qua URL repository, nội dung văn bản kèm tệp đính kèm.
  - Mentor chấm điểm và gửi feedback.
- Quản lý tệp tải lên:
  - Tải tệp lên Cloudflare R2 / S3 storage, lưu metadata và gắn tệp vào bài nộp.

## 4. Cài đặt và khởi chạy

### Yêu cầu môi trường

- Node.js version 20 trở lên
- PostgreSQL version 16 trở lên (hoặc Docker)
- npm version 9 trở lên

### Cách 1: Khởi chạy trực tiếp với Node.js

1. Cài đặt thư viện:

```bash
npm install
```

2. Cấu hình biến môi trường:
   Tạo file `.env` từ `.env.example` và điều chỉnh thông tin kết nối:

```bash
cp .env.example .env
```

Các biến môi trường quan trọng:

- `PORT`: Cổng chạy ứng dụng (mặc định 3000)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Cấu hình PostgreSQL
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Khóa bí mật ký token
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`: Cấu hình Cloudflare R2 (nếu dùng tính năng tải file)

3. Khởi tạo cơ sở dữ liệu:

```bash
# Chạy migration tạo bảng
npm run migrate

# Nạp dữ liệu mẫu ban đầu (tùy chọn)
npm run seed
```

4. Chạy ứng dụng:

```bash
# Môi trường phát triển (có nodemon tự reload)
npm run dev

# Môi trường production
npm start
```

### Cách 2: Khởi chạy bằng Docker Compose

Khởi động cả hệ thống cơ sở dữ liệu PostgreSQL và Backend tự động (đã tích hợp tự chạy migration):

```bash
docker compose up -d --build
```

Để dừng các container:

```bash
docker compose down
```

## 5. Tài khoản thử nghiệm mặc định (sau khi chạy seed)

- Quản trị viên (ADMIN):
  - Email: `admin@sgroup.vn`
- Mentor:
  - Email: `nguyenhuukhoi@gmail.com`
  - Email: `nguyenviettrung@gmail.com`
- Học viên (MEMBER):
  - Email: `thanhbinh@gmail.com`
  - Email: `phucthinh@gmail.com`

Tất cả tài khoản mặc định có mật khẩu là: `Password@123`

## 6. Danh sách lệnh NPM Scripts

- `npm run dev`: Chạy server trong môi trường phát triển qua nodemon.
- `npm start`: Khởi động server trực tiếp bằng Node.js.
- `npm run migrate`: Thực thi các file migration trong thư mục `migrations/`.
- `npm run seed`: Chạy script nạp tài khoản và dữ liệu kiểm thử mẫu.
- `npm run db:reset`: Xóa dữ liệu và thiết lập lại cơ sở dữ liệu từ đầu.
- `npm test`: Thực thi toàn bộ bộ kiểm thử tự động với Node.js Test Runner.
