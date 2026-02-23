import React, { useEffect, useMemo, useState } from "react";
import { Typography, Card, CardContent } from "@mui/material";
import Navbar from "../components/Navbar";
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

export default function TeacherApprovalHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/teacher/approval-history");
        const rows = res.data?.data || [];
        if (alive) setItems(rows);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // กัน backend ไม่ sort: sort ซ้ำให้ชัวร์
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = new Date(a.approved_at).getTime();
      const tb = new Date(b.approved_at).getTime();
      if (tb !== ta) return tb - ta;
      return (b.approval_id || 0) - (a.approval_id || 0);
    });
  }, [items]);

  return (
    <div>
      <Navbar />

      <div className="p-6 mt-16">
        <Typography variant="h4" gutterBottom>
          ประวัติการอนุมัติ
        </Typography>

        {loading && <div className="text-white/80">กำลังโหลด...</div>}

        {!loading && sorted.length === 0 && (
          <div className="text-white/80">ยังไม่มีประวัติ</div>
        )}

        {!loading && sorted.length > 0 && (
          <div className="mt-6">
            {/* เส้น Timeline */}
            <div className="relative border-l border-white/20 ml-3">
              {sorted.map((it) => {
                const status = String(it.status || "").toLowerCase();
                const isRejected = status.includes("reject");
                const badgeClass = isRejected
                  ? "bg-red-500/15 text-red-200 border-red-400/25"
                  : "bg-green-500/15 text-green-200 border-green-400/25";

                return (
                  <div key={it.approval_id} className="relative pl-8 pb-6">
                    {/* จุด */}
                    <div className="absolute -left-[7px] top-2 w-3.5 h-3.5 rounded-full bg-white"></div>

                    <Card className="!bg-white/5 !text-white border border-white/10">
                      <CardContent>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Typography variant="h6" className="!text-white">
                            {it.document_title || `เอกสาร #${it.document_id}`}
                          </Typography>

                          <span className={`px-3 py-1 rounded-full text-sm border ${badgeClass}`}>
                            {isRejected ? "❌ Rejected" : "✅ Approved"}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-white/80 space-y-1">
                          <div>เอกสาร ID: {it.document_id}</div>
                          <div>ดำเนินการโดย: {it.approver_name || it.approver_id}</div>
                          <div>วันเวลา: {formatThaiDateTime(it.approved_at)}</div>
                          <div>สถานะ: {it.status}</div>

                          {isRejected && (
                            <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-400/20">
                              <div className="font-semibold text-red-200">เหตุผลที่ปฏิเสธ</div>
                              <div className="text-red-100/90 whitespace-pre-wrap">
                                {it.reason || "-"}
                              </div>
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
        )}
      </div>
    </div>
  );
}