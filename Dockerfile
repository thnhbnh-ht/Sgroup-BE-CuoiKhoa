FROM node:20-alpine

WORKDIR /app

# Copy file định nghĩa package để tận dụng Docker cache
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Khai báo port ứng dụng lắng nghe
EXPOSE 5000

# Lệnh khởi chạy server
CMD ["npm", "start"]