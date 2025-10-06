import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Card, CardContent, Typography } from "@mui/material";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [popularDocs, setPopularDocs] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/documents/recommended")
      .then((res) => setPopularDocs(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Typography variant="h4" gutterBottom>
        หน้านักศึกษา
      </Typography>

      {popularDocs.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          ยังไม่มีผลงานที่อัปโหลด
        </Typography>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDocs.map((doc) => (
            <Card key={doc.document_id} className="shadow">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {doc.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-2">
                  คำค้นหา: {doc.keywords || "ไม่ระบุ"}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-2">
                  ปีการศึกษา: {doc.academic_year || "ไม่ระบุ"}
                </Typography>
                <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
                  ดูรายละเอียด
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
