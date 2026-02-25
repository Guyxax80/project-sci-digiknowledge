// client/src/pages/Upload.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MAX_VIDEO_MB = 100;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VIDEO_SIZE_ERROR_MESSAGE =
  "วิดีโอเกิน 100MB (จำกัดตามระบบ) กรุณาลดขนาดไฟล์ก่อนอัปโหลด";

const FIXED_CATEGORIES = [
  { id: "1", name: "Hardware" },
  { id: "2", name: "Software" },
];

// ✅ รายการไฟล์ที่ “ต้องครบ” ก่อนส่งให้ที่ปรึกษา
const REQUIRED_SECTIONS = [
  { key: "cover", label: "ปก (cover)" },
  { key: "abstract", label: "บทคัดย่อ (abstract)" },
  { key: "acknowledgement", label: "กิตติกรรมประกาศ (acknowledgement)" },
  { key: "toc", label: "สารบัญ (toc)" },
  { key: "chapter1", label: "บทที่ 1 (chapter1)" },
  { key: "chapter2", label: "บทที่ 2 (chapter2)" },
  { key: "chapter3", label: "บทที่ 3 (chapter3)" },
  { key: "chapter4", label: "บทที่ 4 (chapter4)" },
  { key: "chapter5", label: "บทที่ 5 (chapter5)" },
  { key: "bibliography", label: "บรรณานุกรม (bibliography)" },
  { key: "appendix", label: "ภาคผนวก (appendix)" },
  { key: "author_bio", label: "ประวัติผู้จัดทำ (author_bio)" },
  { key: "presentation_video", label: "วิดีโอนำเสนอ (presentation_video)" },
];

export default function UploadDocument() {
  const navigate = useNavigate();

  // ✅ permission/eligibility
  const [eligLoading, setEligLoading] = useState(true);
  const [uploadBlocked, setUploadBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const [title, setTitle] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearDate, setAcademicYearDate] = useState("");

  // ไฟล์รายส่วน
  const [coverFile, setCoverFile] = useState(null);
  const [abstractFile, setAbstractFile] = useState(null);
  const [ackFile, setAckFile] = useState(null);
  const [tocFile, setTocFile] = useState(null);
  const [chapter1File, setChapter1File] = useState(null);
  const [chapter2File, setChapter2File] = useState(null);
  const [chapter3File, setChapter3File] = useState(null);
  const [chapter4File, setChapter4File] = useState(null);
  const [chapter5File, setChapter5File] = useState(null);
  const [bibliographyFile, setBibliographyFile] = useState(null);
  const [appendixFile, setAppendixFile] = useState(null);
  const [authorBioFile, setAuthorBioFile] = useState(null);
  const [presentationVideoFile, setPresentationVideoFile] = useState(null);

  const filesMap = useMemo(
    () => ({
      cover: coverFile,
      abstract: abstractFile,
      acknowledgement: ackFile,
      toc: tocFile,
      chapter1: chapter1File,
      chapter2: chapter2File,
      chapter3: chapter3File,
      chapter4: chapter4File,
      chapter5: chapter5File,
      bibliography: bibliographyFile,
      appendix: appendixFile,
      author_bio: authorBioFile,
      presentation_video: presentationVideoFile,
    }),
    [
      coverFile,
      abstractFile,
      ackFile,
      tocFile,
      chapter1File,
      chapter2File,
      chapter3File,
      chapter4File,
      chapter5File,
      bibliographyFile,
      appendixFile,
      authorBioFile,
      presentationVideoFile,
    ]
  );

  const validatePresentationVideoSize = (file) => {
    if (!file) return true;
    if (file.size <= MAX_VIDEO_BYTES) return true;
    alert(VIDEO_SIZE_ERROR_MESSAGE);
    return false;
  };

  const mustLogin = () => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      alert("กรุณา login ก่อนอัปโหลด");
      return null;
    }
    return storedUserId;
  };

  const validateBaseFields = () => {
    if (!title.trim()) {
      alert("กรุณากรอกชื่อเอกสาร");
      return false;
    }
    if (selectedCategoryIds.length === 0) {
      alert("กรุณาเลือกหมวดหมู่ (Hardware/Software)");
      return false;
    }
    return true;
  };

  // ✅ ตรวจไฟล์ให้ครบทุกหัวข้อ ก่อน Submit
  const validateAllRequiredFiles = () => {
    const missing = [];
    for (const r of REQUIRED_SECTIONS) {
      if (!filesMap[r.key]) missing.push(`- ${r.label}`);
    }

    if (missing.length) {
      alert(`ส่งให้ที่ปรึกษาไม่ได้ เพราะไฟล์ยังไม่ครบ:\n\n${missing.join("\n")}`);
      return false;
    }

    if (!validatePresentationVideoSize(presentationVideoFile)) return false;
    return true;
  };

  // ✅ เช็ค email ก่อน “ส่งให้ที่ปรึกษา”
  const mustHaveEmail = async () => {
    try {
      const res = await api.get("/auth/me");
      const email = String(res?.data?.user?.email || "").trim();

      if (!email) {
        alert("ส่งให้ที่ปรึกษาไม่ได้: กรุณาเพิ่มอีเมลในโปรไฟล์ก่อน");
        navigate("/profile");
        return false;
      }
      return true;
    } catch (err) {
      console.error("CHECK EMAIL ERR:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "ตรวจสอบอีเมลไม่สำเร็จ กรุณาลองใหม่");
      return false;
    }
  };

  // ✅ NEW: เช็ค “student code ผ่านอนุมัติแล้วไหม” ตอนเข้าหน้า
  const checkStudentEligibility = useCallback(async () => {
    setEligLoading(true);
    setUploadBlocked(false);
    setBlockMessage("");

    try {
      const res = await api.get("/student-codes/me");
      const eligible = Boolean(res?.data?.eligible);

      if (!eligible) {
        setUploadBlocked(true);
        setBlockMessage(
          res?.data?.message ||
            "ฟังก์ชันอัปโหลดจะต้องมี Student ID ที่ผ่านการอนุมัติแล้วเท่านั้น กรุณาติดต่ออาจารย์หรือผู้ดูแลระบบเพื่อขออนุมัติ Student ID ของคุณก่อนใช้งาน"
        );
      }
    } catch (err) {
      console.error("CHECK ELIGIBILITY ERR:", err?.response?.data || err.message);
      setUploadBlocked(true);
      setBlockMessage("ไม่สามารถตรวจสอบสิทธิ์การอัปโหลดได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setEligLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStudentEligibility();
  }, [checkStudentEligibility]);

  const createDraftDocument = async () => {
    if (uploadBlocked) {
      alert(blockMessage || "ยังไม่สามารถใช้งานการอัปโหลดได้");
      return null;
    }

    const storedUserId = mustLogin();
    if (!storedUserId) return null;
    if (!validateBaseFields()) return null;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("keywords", keywords);
    formData.append("academic_year", academicYear);
    formData.append("user_id", storedUserId);
    formData.append("status", "draft");
    formData.append("categorie_ids", JSON.stringify(selectedCategoryIds));

    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { documentId } = res.data || {};
    return documentId || null;
  };

  const uploadSectionsIfAny = async (documentId) => {
  // filesMap: { cover: File, abstract: File, ... } ตามที่คุณเก็บไว้
  // REQUIRED_SECTIONS: [{ key: 'cover' }, ...] หรือเป็น array ของ key
  const entries = REQUIRED_SECTIONS.map((x) => x.key); // ถ้าของคุณเป็น [{key,...}]
  // ถ้า REQUIRED_SECTIONS เป็น array string อยู่แล้ว ให้ใช้: const entries = REQUIRED_SECTIONS;

  for (const sectionKey of entries) {
    const file = filesMap[sectionKey];
    if (!file) continue; // draft อนุญาตให้ไม่ครบได้

    const fd = new FormData();
    fd.append("file", file);          // ✅ multer single('file')
    fd.append("section", sectionKey); // ✅ backend อ่าน req.body.section

    await api.post(`/upload/documents/${documentId}/sections`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // กรณีวิดีโอแยกตัวแปร
  if (presentationVideoFile) {
    const fd = new FormData();
    fd.append("file", presentationVideoFile);
    fd.append("section", "presentation_video");

    await api.post(`/upload/documents/${documentId}/sections`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
};

  const clearForm = () => {
    setTitle("");
    setSelectedCategoryIds([]);
    setKeywords("");
    setAcademicYear("");
    setAcademicYearDate("");

    setCoverFile(null);
    setAbstractFile(null);
    setAckFile(null);
    setTocFile(null);
    setChapter1File(null);
    setChapter2File(null);
    setChapter3File(null);
    setChapter4File(null);
    setChapter5File(null);
    setBibliographyFile(null);
    setAppendixFile(null);
    setAuthorBioFile(null);
    setPresentationVideoFile(null);
  };

  // =========================
  // ✅ บันทึกฉบับร่าง (ไฟล์ไม่ครบได้)
  // =========================
  const handleSaveDraft = async () => {
    try {
      if (uploadBlocked) {
        alert(blockMessage || "ยังไม่สามารถใช้งานการอัปโหลดได้");
        return;
      }

      if (!validatePresentationVideoSize(presentationVideoFile)) return;

      const documentId = await createDraftDocument();
      if (!documentId) return;

      await uploadSectionsIfAny(documentId);

      alert("บันทึกฉบับร่างสำเร็จ (คุณสามารถมาอัปไฟล์เพิ่มทีหลังได้)");
      clearForm();
    } catch (err) {
      console.error("DRAFT ERR:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // =========================
  // ✅ ส่งให้ที่ปรึกษา (ต้องครบทุกไฟล์ + ต้องมี email)
  // =========================
  const handleSubmitToAdvisor = async () => {
    try {
      if (uploadBlocked) {
        alert(blockMessage || "ยังไม่สามารถใช้งานการอัปโหลดได้");
        return;
      }

      if (!validateBaseFields()) return;
      if (!validateAllRequiredFiles()) return;

      const okEmail = await mustHaveEmail();
      if (!okEmail) return;

      const documentId = await createDraftDocument();
      if (!documentId) return;

      await uploadSectionsIfAny(documentId);

      await api.post(`/documents/${documentId}/submit`);

      alert("ส่งให้ที่ปรึกษาเรียบร้อยแล้ว");
      clearForm();
    } catch (err) {
      console.error("SUBMIT ERR:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // ✅ disable ทั้งฟอร์มเมื่อ blocked
  const formDisabled = eligLoading || uploadBlocked;

  // ===== UI-only helpers =====
  const uploadedCount = useMemo(() => {
    let c = 0;
    for (const r of REQUIRED_SECTIONS) if (filesMap[r.key]) c += 1;
    return c;
  }, [filesMap]);

  const totalRequired = REQUIRED_SECTIONS.length;
  const progressPct = totalRequired ? Math.round((uploadedCount / totalRequired) * 100) : 0;

  const fileHint = (file) => {
    if (!file) return "ยังไม่ได้เลือกไฟล์";
    const kb = Math.round(file.size / 1024);
    const sizeText = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
    return `${file.name} • ${sizeText}`;
  };

  return (
    <div className="min-h-screen bg-black/[0.02] py-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
        {/* ===== Header / Hero ===== */}
        <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-brand-800">
                  อัปโหลดเอกสาร
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  บันทึกฉบับร่างได้แม้ไฟล์ไม่ครบ • ส่งให้ที่ปรึกษาต้องครบทุกไฟล์
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate("/documents")}
                  className="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/[0.03] transition font-semibold"
                >
                  ← กลับไปหน้ารายการ
                </button>
              </div>
            </div>

            {/* progress (UI only) */}
            <div className="mt-5 rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-semibold text-gray-800">
                  ความคืบหน้าไฟล์ที่ต้องมี: {uploadedCount}/{totalRequired} ({progressPct}%)
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                  แนะนำ: อัปโหลดให้ครบก่อนกด “ส่งให้ที่ปรึกษา”
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ แจ้งเตือนทันทีตอนเข้าหน้า ถ้าไม่มี student code */}
        {eligLoading && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 p-4 shadow-sm">
            <div className="font-semibold">กำลังตรวจสอบสิทธิ์การอัปโหลด...</div>
            <div className="text-sm text-gray-600 mt-1">กรุณารอสักครู่</div>
          </div>
        )}

        {!eligLoading && uploadBlocked && (
          <div className="rounded-2xl border border-yellow-300 bg-yellow-50 text-yellow-900 p-5 shadow-sm">
            <div className="font-black text-lg mb-1">ยังไม่สามารถใช้งานการอัปโหลดได้</div>
            <div className="text-sm">{blockMessage}</div>

            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-4 py-2 rounded-xl bg-white border border-yellow-400 hover:bg-yellow-100 transition font-semibold"
              >
                ไปหน้าโปรไฟล์
              </button>
              <button
                type="button"
                onClick={checkStudentEligibility}
                className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white transition font-semibold"
              >
                ตรวจสอบอีกครั้ง
              </button>
            </div>
          </div>
        )}

        {/* ===== Form body (disabled UI) ===== */}
        <div className={`space-y-6 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
          {/* ===== Basic info card ===== */}
          <div className="rounded-3xl border border-black/5 shadow-lg bg-white overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="text-xl font-black text-gray-800 mb-4">🧾 ข้อมูลเอกสาร</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">ชื่อเอกสาร</span>
                  <input
                    type="text"
                    placeholder="กรอกชื่อเอกสาร"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border border-black/10 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    required
                    disabled={formDisabled}
                  />
                </label>

                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    เลือกหมวดหมู่ (เลือกได้ไม่เกิน 2)
                  </p>

                  <div className="rounded-2xl border border-black/10 p-4 bg-black/[0.02]">
                    <div className="flex flex-col gap-2">
                      {FIXED_CATEGORIES.map((cat) => {
                        const checked = selectedCategoryIds.includes(cat.id);
                        const disableUnchecked = !checked && selectedCategoryIds.length >= 2;

                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 border border-black/5 bg-white hover:bg-black/[0.02] transition ${
                              disableUnchecked ? "opacity-60" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={formDisabled || disableUnchecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategoryIds((prev) => (prev.length >= 2 ? prev : [...prev, cat.id]));
                                } else {
                                  setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                                }
                              }}
                            />
                            <span className="font-semibold text-gray-800">{cat.name}</span>
                            {checked ? (
                              <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                เลือกแล้ว
                              </span>
                            ) : (
                              <span className="ml-auto text-xs text-gray-400">
                                {disableUnchecked ? "เลือกได้ครบ 2 แล้ว" : ""}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      เลือกแล้ว: <span className="font-semibold">{selectedCategoryIds.length}</span>/2
                    </div>
                  </div>
                </div>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">คำค้นหา</span>
                  <input
                    type="text"
                    placeholder="เช่น IoT, AI, ระบบจัดการเอกสาร"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="border border-black/10 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    disabled={formDisabled}
                  />
                </label>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">ปีการศึกษา</span>
                  <input
                    type="date"
                    value={academicYearDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAcademicYearDate(val);
                      const gYear = val ? new Date(val).getFullYear() : null;
                      const thaiYear = gYear ? (gYear + 543).toString() : "";
                      setAcademicYear(thaiYear);
                    }}
                    className="border border-black/10 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    disabled={formDisabled}
                  />
                  {academicYear && (
                    <span className="text-sm text-gray-600 mt-1">เลือกปี (พ.ศ.): {academicYear}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Upload sections card ===== */}
          <div className="rounded-3xl border border-black/5 shadow-lg bg-white overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="text-xl font-black text-gray-800">📎 อัปโหลดไฟล์รายส่วน</div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                  ส่งให้ที่ปรึกษาต้องครบ {totalRequired} รายการ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ใช้ “label + file hint” เพื่อ UI ดูดีขึ้น (logic เดิม) */}
                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">ปก (cover)</span>
                  <input
                    type="file"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(coverFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บทคัดย่อ (abstract)</span>
                  <input
                    type="file"
                    onChange={(e) => setAbstractFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(abstractFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">กิตติกรรมประกาศ (acknowledgement)</span>
                  <input
                    type="file"
                    onChange={(e) => setAckFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(ackFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">สารบัญ (toc)</span>
                  <input
                    type="file"
                    onChange={(e) => setTocFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(tocFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บทที่ 1 (chapter1)</span>
                  <input
                    type="file"
                    onChange={(e) => setChapter1File(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(chapter1File)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บทที่ 2 (chapter2)</span>
                  <input
                    type="file"
                    onChange={(e) => setChapter2File(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(chapter2File)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บทที่ 3 (chapter3)</span>
                  <input
                    type="file"
                    onChange={(e) => setChapter3File(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(chapter3File)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บทที่ 4 (chapter4)</span>
                  <input
                    type="file"
                    onChange={(e) => setChapter4File(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(chapter4File)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บทที่ 5 (chapter5)</span>
                  <input
                    type="file"
                    onChange={(e) => setChapter5File(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(chapter5File)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">บรรณานุกรม (bibliography)</span>
                  <input
                    type="file"
                    onChange={(e) => setBibliographyFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(bibliographyFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">ภาคผนวก (appendix)</span>
                  <input
                    type="file"
                    onChange={(e) => setAppendixFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(appendixFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <span className="text-sm font-semibold text-gray-800">ประวัติผู้จัดทำ (author_bio)</span>
                  <input
                    type="file"
                    onChange={(e) => setAuthorBioFile(e.target.files?.[0] || null)}
                    disabled={formDisabled}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(authorBioFile)}</span>
                </label>

                <label className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.02] p-3 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">
                      วิดีโอนำเสนอ (presentation_video)
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      สูงสุด {MAX_VIDEO_MB}MB
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="video/*"
                    disabled={formDisabled}
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      if (!validatePresentationVideoSize(selectedFile)) {
                        e.target.value = "";
                        setPresentationVideoFile(null);
                        return;
                      }
                      setPresentationVideoFile(selectedFile);
                    }}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">{fileHint(presentationVideoFile)}</span>
                  {presentationVideoFile?.size > 0 ? (
                    <div className="text-xs text-gray-500 mt-1">
                      * หากอัปโหลดไม่ผ่าน ให้ลดขนาดวิดีโอ (ระบบจำกัด 100MB)
                    </div>
                  ) : null}
                </label>
              </div>
            </div>
          </div>

          {/* ===== Actions ===== */}
          <div className="rounded-3xl border border-black/5 shadow-lg bg-white overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    * บันทึกฉบับร่างอัปไฟล์ไม่ครบได้ แต่ <span className="font-semibold">ส่งให้ที่ปรึกษา</span> ต้องครบทุกไฟล์
                  </div>
                  <div>
                    ฟังก์ชันอัปโหลดต้องมี Student Code ที่ผ่านการอนุมัติแล้ว
                  </div>
                </div>

                <div className="flex gap-2 flex-col sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white transition font-bold"
                    disabled={formDisabled}
                  >
                    บันทึกฉบับร่าง
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitToAdvisor}
                    className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white transition font-bold"
                    disabled={formDisabled}
                  >
                    ส่งให้ที่ปรึกษา
                  </button>
                </div>
              </div>

              {/* UI-only: quick checklist */}
              <div className="mt-4 rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-semibold text-gray-800">เช็คลิสต์ไฟล์ที่ต้องมี</div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-black/10">
                    ครบแล้ว {uploadedCount}/{totalRequired}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REQUIRED_SECTIONS.map((r) => {
                    const ok = Boolean(filesMap[r.key]);
                    return (
                      <div
                        key={r.key}
                        className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border ${
                          ok
                            ? "bg-green-50 text-green-800 border-green-200"
                            : "bg-white text-gray-700 border-black/10"
                        }`}
                      >
                        <span className="text-sm font-semibold">{r.label}</span>
                        <span className="text-xs font-bold">
                          {ok ? "✔" : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* small bottom spacing */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}