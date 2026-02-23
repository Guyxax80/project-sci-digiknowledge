import React, { useEffect, useMemo, useState } from "react";
import { Typography, Card, CardContent } from "@mui/material";
import Navbar from "../components/Navbar";
import api from "../services/api";

function formatThaiDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const TeacherDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/teacher/approval-history");
        if (alive) setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // เผื่อ backend ยังไม่ sort ก็ sort ซ้ำฝั่งหน้า
  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.acted_at) - new Date(a.acted_at));
  }, [logs]);

  return (
    <div>
      <Navbar />

      <div className="p-6 mt-16">
        <Typography variant="h4" gutterBottom>
          ประวัติการอนุมัติ
        </Typography>

        {loading && <div className="text-white/80">กำลังโหลด...</div>}

        {!loading && sorted.length === 0 && (
          <div className="text-white/80">ยังไม่มีประวัติการอนุมัติ</div>
        )}

        {/* Timeline */}
        <div className="mt-6">
          <div className="relative border-l border-white/20 ml-3">
            {sorted.map((item) => {
              const isApproved = (item.action || "").toLowerCase() === "approved";
              const badge = isApproved
                ? "bg-green-500/20 text-green-200 border-green-400/30"
                : "bg-red-500/20 text-red-200 border-red-400/30";

              return (
                <div key={item.log_id} className="relative pl-8 pb-6">
                  {/* dot */}
                  <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-white"></div>

                  <Card className="!bg-white/5 !text-white border border-white/10">
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Typography variant="h6" className="!text-white">
                          {item.document_title || `เอกสาร #${item.document_id}`}
                        </Typography>

                        <span className={`px-3 py-1 rounded-full text-sm border ${badge}`}>
                          {isApproved ? "อนุมัติ" : "ปฏิเสธ"}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-white/80 space-y-1">
                        <div>ดำเนินการโดย: {item.acted_by_name || "-"}</div>
                        <div>วันเวลา: {formatThaiDateTime(item.acted_at)}</div>
                        <div>สถานะ: {item.status}</div>

                        {!isApproved && (
                          <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-400/20">
                            <div className="font-semibold text-red-200">เหตุผลที่ปฏิเสธ</div>
                            <div className="text-red-100/90">{item.reject_reason}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;