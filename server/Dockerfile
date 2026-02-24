FROM node:20-bullseye

# ✅ ติดตั้งเครื่องมือ postgres: pg_dump, psql
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ติดตั้ง dependencies
COPY package*.json ./
RUN npm install --production

# คัดลอกโค้ดทั้งหมดใน server
COPY . .

# Railway มักส่ง PORT มาให้ (เช่น 8080)
ENV PORT=8080
EXPOSE 8080

# สั่งรันเซิร์ฟเวอร์
CMD ["node", "server.js"]