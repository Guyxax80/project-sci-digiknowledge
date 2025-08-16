// server/models/FileModel.js
const db = require('../db');

const saveFile = (filename, originalName, fileType, fileSize, callback) => {
  const sql = `INSERT INTO files (filename, original_name, type, size) VALUES (?, ?, ?, ?)`;
  db.query(sql, [filename, originalName, fileType, fileSize], callback);
};

module.exports = { saveFile };
