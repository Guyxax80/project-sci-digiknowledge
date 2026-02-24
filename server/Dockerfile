FROM node:20-bookworm

# ✅ ติดตั้ง pg_dump/psql เวอร์ชัน 17 ให้ตรงกับ server 17.x
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client-17 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ติดตั้ง dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# คัดลอกโค้ดทั้งหมดใน server
COPY . .

# Railway ส่ง PORT มาให้เอง (เช่น 8080) — ไม่ต้อง fix ค่า แต่ใส่ไว้เป็น default ได้
ENV PORT=8080
EXPOSE 8080

# (ทางเลือก) ยืนยันเวอร์ชันใน log ตอน build/run
# RUN pg_dump --version && psql --version

CMD ["node", "server.js"]