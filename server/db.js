const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sci_digiknowledge',
  charset: 'utf8mb4'
});

connection.connect((err) => {
  if (err) {
    console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูลสำเร็จ!');
});

module.exports = connection;
