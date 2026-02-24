FROM node:20-bookworm

# ติดตั้งเครื่องมือสำหรับเพิ่ม repo (curl/gnupg/ca-certificates)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
 && rm -rf /var/lib/apt/lists/*

# เพิ่ม PostgreSQL APT repo (PGDG) เพื่อให้ติดตั้ง postgresql-client-17 ได้
RUN set -eux; \
  install -d /usr/share/postgresql-common/pgdg; \
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg; \
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list; \
  apt-get update; \
  apt-get install -y --no-install-recommends postgresql-client-17; \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ติดตั้ง dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# คัดลอกโค้ดทั้งหมด
COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]