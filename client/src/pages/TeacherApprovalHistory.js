import React, { useEffect, useMemo, useState } from "react";
import { Typography, Card, CardContent, Chip } from "@mui/material";
import api from "../services/api";

function formatThaiDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ✅ ทำชื่อให้สวย + fallback ให้ดูดี
function prettifyName(name, studentId) {
  const cleaned = String(name || "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned) return cleaned;

  // fallback ถ้าไม่มีชื่อ
  if (studentId) return `นักศึกษา รหัส ${studentId}`;
  return "นักศึกษาไม่ทราบชื่อ";
}

export default function TeacherApprovalHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openStudents, setOpenStudents] = useState(new Set());
  const [openDocs, setOpenDocs] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/teacher/approval-history");
        setItems(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 sort ล่าสุดก่อน
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
  }, [items]);

  // 🔹 group ตาม student
  const grouped = useMemo(() => {
    const map = new Map();

    for (const it of sorted) {
      const sid = it.student_id;

      if (!map.has(sid)) {
        map.set(sid, {
          student_id: sid,
          student_name: it.student_name,
          class_group: it.class_group, // ถ้า backend ส่งมา
          level: it.level, // ถ้า backend ส่งมา
          documents: {},
        });
      }

      // อัปเดตข้อมูลนักศึกษาให้ล่าสุด (กันบางแถวไม่มีชื่อ)
      const cur = map.get(sid);
      if (!cur.student_name && it.student_name) cur.student_name = it.student_name;
      if (!cur.class_group && it.class_group) cur.class_group = it.class_group;
      if (!cur.level && it.level) cur.level = it.level;

      if (!cur.documents[it.document_id]) {
        cur.documents[it.document_id] = [];
      }
      cur.documents[it.document_id].push(it);
    }

    return Array.from(map.entries());
  }, [sorted]);

  const toggleStudent = (id) => {
    setOpenStudents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDoc = (id) => {
    setOpenDocs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <Typography variant="h4" className="!text-slate-900 !font-bold mb-6">
        ประวัติการอนุมัติ
      </Typography>

      {loading && <div className="text-slate-700">กำลังโหลด...</div>}

      {!loading &&
        grouped.map(([studentId, data]) => {
          const studentOpen = openStudents.has(studentId);
          const displayName = prettifyName(data.student_name, data.student_id);

          return (
            <Card
              key={studentId}
              className="mb-6 border border-slate-200 shadow-sm bg-white rounded-xl"
            >
              <CardContent>
                {/* Student Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm">
                        {displayName?.[0] || "N"}
                      </div>
                      <div className="min-w-0">
                        <Typography
                          variant="h6"
                          className="!text-slate-900 !font-bold truncate"
                        >
                          {displayName}
                        </Typography>

                        {/* sub line */}
                        <div className="text-xs text-slate-600 mt-0.5">
                          Student ID: {data.student_id ?? "-"}
                        </div>
                      </div>
                    </div>

                    {/* chips */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.class_group && (
                        <Chip size="small" label={`กลุ่ม/ห้อง: ${data.class_group}`} />
                      )}
                      {data.level && <Chip size="small" label={`ระดับ: ${data.level}`} />}
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`เอกสารทั้งหมด: ${Object.keys(data.documents).length}`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStudent(studentId)}
                    className="shrink-0 px-3 py-1 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    {studentOpen ? "ย่อ" : "ดูเอกสาร"}
                  </button>
                </div>

                {/* Documents */}
                {studentOpen && (
                  <div className="mt-5 space-y-4">
                    {Object.entries(data.documents).map(([docId, events]) => {
                      const docOpen = openDocs.has(docId);
                      const latest = events[0];

                      return (
                        <div
                          key={docId}
                          className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                        >
                          <div className="flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {latest.document_title}
                              </div>
                              <div className="text-sm text-slate-600">
                                ล่าสุด: {formatThaiDateTime(latest.approved_at)}
                              </div>
                            </div>

                            <button
                              onClick={() => toggleDoc(docId)}
                              className="shrink-0 px-3 py-1 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                            >
                              {docOpen ? "ซ่อนประวัติ" : "ดูประวัติ"}
                            </button>
                          </div>

                          {docOpen && (
                            <div className="mt-3 space-y-2">
                              {events.map((it) => (
                                <div
                                  key={it.approval_id}
                                  className="p-3 bg-white border border-slate-200 rounded-lg"
                                >
                                  <div className="text-sm text-slate-700">
                                    {formatThaiDateTime(it.approved_at)} —{" "}
                                    <span className="font-medium">{it.status}</span>
                                  </div>
                                  {it.reason && (
                                    <div className="text-sm text-red-600 mt-1">
                                      เหตุผล: {it.reason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}