const mysql = require('mysql2');

const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect(err => {
  if (err) {
    console.error('เชื่อมต่อฐานข้อมูล Railway ล้มเหลว:', err);
    return;
  }
  console.log('✅ เชื่อมต่อฐานข้อมูล Railway สำเร็จ!');
});

module.exports = connection;
