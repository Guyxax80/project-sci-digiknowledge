const db = require('./db');

console.log('ทดสอบ logic สำหรับ document 92...');

db.query('SELECT * FROM document_files WHERE document_id = 92', (err, files) => {
  if (err) {
    console.error('Error:', err);
    process.exit();
  }

  console.log('Files found:', files.length);
  
  files.forEach(file => {
    console.log('Processing file:', file.file_path, file.file_type);
    console.log('cover_path:', file.cover_path);
    console.log('abstract_path:', file.abstract_path);
    console.log('presentation_video_path:', file.presentation_video_path);
    
    // ตรวจสอบว่าเป็นโครงสร้างแถวเดียว
    if (file.cover_path || file.abstract_path || file.presentation_video_path) {
      console.log('Found single-row structure with multiple columns');
      
      // ตรวจสอบไฟล์วิดีโอ
      if (file.presentation_video_path) {
        console.log('Video file found:', file.presentation_video_path);
      }

      // สร้างรายการไฟล์จากคอลัมน์ต่างๆ
      const fileColumns = [
        { column: 'cover_path', section: 'cover' },
        { column: 'abstract_path', section: 'abstract' },
        { column: 'acknowledgement_path', section: 'acknowledgement' },
        { column: 'file_path', section: 'main' }
      ];

      const downloadFiles = [];
      fileColumns.forEach(({ column, section }) => {
        if (file[column]) {
          downloadFiles.push({
            document_file_id: file.document_file_id,
            file_path: file[column],
            section: section,
            original_name: file.original_name || `${section}.pdf`
          });
        }
      });
      
      console.log('Download files:', downloadFiles);
    } else {
      console.log('Multi-row structure');
    }
  });
  
  process.exit();
});

