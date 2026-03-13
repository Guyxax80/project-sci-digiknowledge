import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  IconButton,
  Badge,
  Chip,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import FilterListIcon from "@mui/icons-material/FilterList";

const DocumentPage = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  useEffect(() => {
    api
      .get("/documents")
      .then((res) => {
        setDocuments(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API error:", err);
        setError("ไม่สามารถดึงข้อมูลเอกสารได้");
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("th-TH", options);
  };

  const publicDocuments = useMemo(() => {
    return documents.filter(
      (doc) => String(doc.status || "").toLowerCase() !== "draft"
    );
  }, [documents]);

  const availableCategories = useMemo(() => {
    const allCategories = publicDocuments
      .flatMap((doc) =>
        String(doc.category_names || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
      .filter((item) => item !== "-");

    return [...new Set(allCategories)].sort((a, b) =>
      a.localeCompare(b, "th")
    );
  }, [publicDocuments]);

  const availableYears = useMemo(() => {
    const years = publicDocuments
      .map((doc) => String(doc.academic_year || "").trim())
      .filter(Boolean);

    return [...new Set(years)].sort((a, b) => Number(b) - Number(a));
  }, [publicDocuments]);

  const availableStatuses = useMemo(() => {
    const statuses = publicDocuments
      .map((doc) => String(doc.status || "").trim())
      .filter(Boolean);

    return [...new Set(statuses)].sort((a, b) => a.localeCompare(b, "th"));
  }, [publicDocuments]);

  useEffect(() => {
    setSelectedCategories((prev) =>
      prev.filter((item) => availableCategories.includes(item))
    );
  }, [availableCategories]);

  useEffect(() => {
    setSelectedYears((prev) =>
      prev.filter((item) => availableYears.includes(item))
    );
  }, [availableYears]);

  useEffect(() => {
    setSelectedStatuses((prev) =>
      prev.filter((item) => availableStatuses.includes(item))
    );
  }, [availableStatuses]);

  useEffect(() => {
    document.body.style.overflow = filterOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  const toggleValue = (value, setter) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleCategory = (category) => {
    toggleValue(category, setSelectedCategories);
  };

  const toggleYear = (year) => {
    toggleValue(year, setSelectedYears);
  };

  const toggleStatus = (status) => {
    toggleValue(status, setSelectedStatuses);
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategories([]);
    setSelectedYears([]);
    setSelectedStatuses([]);
  };

  const filteredDocs = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return publicDocuments.filter((doc) => {
      const title = String(doc.title || "").toLowerCase();
      const keywords = String(doc.keywords || "").toLowerCase();
      const academic = String(doc.academic_year || "").toLowerCase();
      const status = String(doc.status || "").toLowerCase();
      const categoriesRaw = String(doc.category_names || "");
      const categories = categoriesRaw.toLowerCase();

      const matchSearch =
        !text ||
        title.includes(text) ||
        keywords.includes(text) ||
        categories.includes(text) ||
        academic.includes(text) ||
        status.includes(text);

      const docCategories = categoriesRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const matchCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => docCategories.includes(cat));

      const matchYear =
        selectedYears.length === 0 ||
        selectedYears.includes(String(doc.academic_year || ""));

      const matchStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(String(doc.status || ""));

      return matchSearch && matchCategory && matchYear && matchStatus;
    });
  }, [
    publicDocuments,
    searchText,
    selectedCategories,
    selectedYears,
    selectedStatuses,
  ]);

  const activeFilterCount =
    selectedCategories.length +
    selectedYears.length +
    selectedStatuses.length;

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 border border-black/5 shadow-md rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-brand-100/60 flex items-center justify-center">
            ⏳
          </div>
          <div className="text-gray-700 font-semibold">กำลังโหลดข้อมูล...</div>
          <div className="text-sm text-gray-500 mt-1">โปรดรอสักครู่</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-red-200 shadow-md rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            ⚠️
          </div>
          <div className="text-red-600 font-semibold">{error}</div>
          <div className="text-sm text-gray-500 mt-1">
            ลองรีเฟรชหน้า หรือเช็คการเชื่อมต่อ
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black/[0.02] py-6">
      {/* ===== Overlay ===== */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 ${
          filterOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setFilterOpen(false)}
      />

      {/* ===== Sidebar Slide From Left ===== */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl border-r border-black/5 transform transition-transform duration-300 ease-out ${
          filterOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-black/5 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-gray-800">
                  ตัวกรองเอกสาร
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  เลือกหมวดหมู่ ปีการศึกษา และสถานะ
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="h-10 w-10 rounded-xl border border-black/10 hover:bg-black/[0.03] transition flex items-center justify-center text-lg"
                title="ปิดตัวกรอง"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 hover:bg-black/[0.03] transition font-semibold"
              >
                ♻️ ล้างตัวกรอง
              </button>

              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2 hover:opacity-90 transition font-semibold"
              >
                ใช้งานตัวกรอง
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* หมวดหมู่ */}
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  🗂️
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">หมวดหมู่</h4>
                  <p className="text-xs text-gray-500">เลือกได้มากกว่า 1 รายการ</p>
                </div>
              </div>

              {availableCategories.length === 0 ? (
                <p className="text-sm text-gray-500">ไม่มีข้อมูลหมวดหมู่</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {availableCategories.map((category) => {
                    const checked = selectedCategories.includes(category);
                    return (
                      <label
                        key={category}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${
                          checked
                            ? "border-blue-300 bg-blue-50"
                            : "border-black/5 hover:bg-black/[0.02]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(category)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ปีการศึกษา */}
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  📅
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">ปีการศึกษา</h4>
                  <p className="text-xs text-gray-500">เลือกได้มากกว่า 1 รายการ</p>
                </div>
              </div>

              {availableYears.length === 0 ? (
                <p className="text-sm text-gray-500">ไม่มีข้อมูลปีการศึกษา</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {availableYears.map((year) => {
                    const checked = selectedYears.includes(year);
                    return (
                      <label
                        key={year}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${
                          checked
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-black/5 hover:bg-black/[0.02]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleYear(year)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {year}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* ===== Header / Hero ===== */}
        <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-brand-800 tracking-tight">
                  ค้นหาและดูรายการเอกสาร
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  ค้นหาจากชื่อเรื่อง, หมวดหมู่, คำค้น, ปีการศึกษา หรือสถานะ
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                  ทั้งหมด: {publicDocuments.length}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 border border-brand-100/70 text-brand-800">
                  แสดงผล: {filteredDocs.length}
                </span>
              </div>
            </div>

            {/* ===== Search + filter bar ===== */}
            <div className="mt-5">
              <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl border border-brand-100/80 bg-white shadow-sm px-4 py-3">
                <Badge
                  badgeContent={activeFilterCount}
                  color="primary"
                  invisible={activeFilterCount === 0}
                >
                  <IconButton
                    onClick={() => setFilterOpen(true)}
                    title="เปิดตัวกรอง"
                    size="small"
                    className="bg-slate-50"
                  >
                    <TuneIcon />
                  </IconButton>
                </Badge>

                <div className="flex items-center gap-3 flex-1">
                  <div className="text-lg">🔍</div>
                  <input
                    className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    type="text"
                    value={searchText}
                    placeholder="ค้นหาเอกสาร (ชื่อเรื่อง, หมวดหมู่, คำค้น, ปีการศึกษา, สถานะ)"
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </div>

                {(searchText || activeFilterCount > 0) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm px-3 py-2 rounded-xl border border-black/10 hover:bg-black/[0.03] transition whitespace-nowrap"
                    title="ล้างคำค้นและตัวกรอง"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              {/* ===== Chips ด้านบนที่เพิ่มเข้ามา ===== */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip
                  size="small"
                  icon={<FilterListIcon />}
                  label={`พบ ${filteredDocs.length} รายการ`}
                  variant="outlined"
                />

                {selectedCategories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={() => toggleCategory(cat)}
                  />
                ))}

                {selectedYears.map((year) => (
                  <Chip
                    key={year}
                    label={`ปี ${year}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    onDelete={() => toggleYear(year)}
                  />
                ))}

                {selectedStatuses.map((status) => (
                  <Chip
                    key={status}
                    label={`สถานะ ${status}`}
                    size="small"
                    color="success"
                    variant="outlined"
                    onDelete={() => toggleStatus(status)}
                  />
                ))}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                * เอกสารสถานะ <span className="font-semibold">draft</span>{" "}
                จะไม่แสดงในหน้านี้
              </div>
            </div>
          </div>
        </div>

        {/* ===== Results ===== */}
        <div className="mt-6">
          {filteredDocs.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-8 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-black/[0.04] flex items-center justify-center">
                🔎
              </div>
              <p className="text-gray-700 font-semibold">ไม่พบเอกสารที่ค้นหา</p>
              <p className="text-sm text-gray-500 mt-1">
                ลองเปลี่ยนคำค้น หรือปรับตัวกรองหมวดหมู่ / ปีการศึกษา / สถานะ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.document_id}
                  className="rounded-2xl border border-black/5 bg-white shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-to-r from-brand-300 via-purple-300 to-pink-300" />

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xl md:text-2xl font-black text-brand-800 leading-snug line-clamp-2">
                          {doc.title}
                        </h3>

                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                            ปีการศึกษา: {doc.academic_year || "-"}
                          </span>
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                            สถานะ: {doc.status || "-"}
                          </span>
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                            ดาวน์โหลด: {Number(doc.download_count || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 italic whitespace-nowrap">
                        อัปโหลด: {doc.uploaded_at ? formatDate(doc.uploaded_at) : "-"}
                      </div>
                    </div>

                    <div className="my-4 h-px bg-black/5" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                      <p className="md:col-span-2">
                        <span className="font-semibold">หมวดหมู่:</span>{" "}
                        <span className="text-gray-700">
                          {doc.category_names || "-"}
                        </span>
                      </p>

                      <p className="md:col-span-2">
                        <span className="font-semibold">คำค้น:</span>{" "}
                        <span className="text-gray-700">{doc.keywords || "-"}</span>
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          navigate(`/document-detail/${doc.document_id}`)
                        }
                        className="inline-flex items-center gap-2 border border-brand-600 text-brand-700 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors duration-200 font-semibold"
                        type="button"
                      >
                        ดูรายละเอียด <span className="text-base">→</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard?.writeText?.(String(doc.title || ""))
                        }
                        className="inline-flex items-center gap-2 border border-black/10 text-gray-700 px-4 py-2 rounded-xl hover:bg-black/[0.03] transition font-semibold"
                        title="คัดลอกชื่อเอกสาร"
                      >
                        คัดลอกชื่อ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;