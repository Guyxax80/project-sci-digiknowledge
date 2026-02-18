const db = require('../db');

const saveFile = async (filename, originalName, fileType, fileSize) => {
  const sql = 'INSERT INTO files (filename, original_name, type, size) VALUES ($1, $2, $3, $4) RETURNING file_id';
  const { rows } = await db.query(sql, [filename, originalName, fileType, fileSize]);
  return rows[0];
};

module.exports = { saveFile };