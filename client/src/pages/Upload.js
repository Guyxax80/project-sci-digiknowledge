// client/src/pages/Upload.js
import React, { useMemo, useState } from "react";
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
      const res = await api.get("/auth/me"); // ✅ ใช้ตัวนี้เลย
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

  const createDraftDocument = async () => {
    const storedUserId = mustLogin();
    if (!storedUserId) return null;
    if (!validateBaseFields()) return null;

    // ✅ สร้างเอกสาร draft (ไม่บังคับมีไฟล์)
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
    const sections = new FormData();

    // ✅ ใส่เฉพาะไฟล์ที่มี (draft อัปไม่ครบได้)
    for (const [key, file] of Object.entries(filesMap)) {
      if (file) sections.append(key, file);
    }

    if ([...sections.keys()].length === 0) return;

    await api.post(`/documents/${documentId}/sections`, sections, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
      if (!validateBaseFields()) return;
      if (!validateAllRequiredFiles()) return;

      // ✅ ต้องมี email ก่อน
      const okEmail = await mustHaveEmail();
      if (!okEmail) return;

      const documentId = await createDraftDocument();
      if (!documentId) return;

      await uploadSectionsIfAny(documentId);

      // ✅ ค่อยเปลี่ยนสถานะเป็น pending และส่งเมลไปที่ปรึกษาที่ผูกไว้
      await api.post(`/documents/${documentId}/submit`);

      alert("ส่งให้ที่ปรึกษาเรียบร้อยแล้ว");
      clearForm();
    } catch (err) {
      console.error("SUBMIT ERR:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto border rounded-lg shadow-md bg-white/80">
      <h2 className="text-2xl font-bold mb-4 text-brand-800">อัปโหลดเอกสาร</h2>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="ชื่อเอกสาร"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          required
        />

        <div>
          <p className="font-semibold mb-2">เลือกหมวดหมู่ (เลือกได้ไม่เกิน 2)</p>

          <div className="flex flex-col gap-2 border rounded p-3">
            {FIXED_CATEGORIES.map((cat) => {
              const checked = selectedCategoryIds.includes(cat.id);
              const disableUnchecked = !checked && selectedCategoryIds.length >= 2;

              return (
                <label key={cat.id} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableUnchecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIds((prev) =>
                          prev.length >= 2 ? prev : [...prev, cat.id]
                        );
                      } else {
                        setSelectedCategoryIds((prev) =>
                          prev.filter((id) => id !== cat.id)
                        );
                      }
                    }}
                  />
                  <span className={disableUnchecked ? "text-gray-400" : ""}>
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            เลือกแล้ว: {selectedCategoryIds.length}/2
          </p>
        </div>

        <input
          type="text"
          placeholder="คำค้นหา"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <div className="flex flex-col">
          <label className="mb-1">ปีการศึกษา</label>
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
            className="border rounded px-3 py-2 w-full"
          />
          {academicYear && (
            <span className="text-sm text-gray-600 mt-1">
              เลือกปี (พ.ศ.): {academicYear}
            </span>
          )}
        </div>

        <hr className="my-2" />
        <h3 className="text-xl font-bold">อัปโหลดไฟล์รายส่วน</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="mb-1">ปก (cover)</span>
            <input
              type="file"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บทคัดย่อ (abstract)</span>
            <input
              type="file"
              onChange={(e) => setAbstractFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">กิตติกรรมประกาศ (acknowledgement)</span>
            <input
              type="file"
              onChange={(e) => setAckFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">สารบัญ (toc)</span>
            <input
              type="file"
              onChange={(e) => setTocFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บทที่ 1 (chapter1)</span>
            <input
              type="file"
              onChange={(e) => setChapter1File(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บทที่ 2 (chapter2)</span>
            <input
              type="file"
              onChange={(e) => setChapter2File(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บทที่ 3 (chapter3)</span>
            <input
              type="file"
              onChange={(e) => setChapter3File(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บทที่ 4 (chapter4)</span>
            <input
              type="file"
              onChange={(e) => setChapter4File(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บทที่ 5 (chapter5)</span>
            <input
              type="file"
              onChange={(e) => setChapter5File(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">บรรณานุกรม (bibliography)</span>
            <input
              type="file"
              onChange={(e) => setBibliographyFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">ภาคผนวก (appendix)</span>
            <input
              type="file"
              onChange={(e) => setAppendixFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1">ประวัติผู้จัดทำ (author_bio)</span>
            <input
              type="file"
              onChange={(e) => setAuthorBioFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex flex-col sm:col-span-2">
            <span className="mb-1">
              วิดีโอนำเสนอ (presentation_video, สูงสุด {MAX_VIDEO_MB}MB)
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                if (!validatePresentationVideoSize(selectedFile)) {
                  e.target.value = "";
                  setPresentationVideoFile(null);
                  return;
                }
                setPresentationVideoFile(selectedFile);
              }}
            />
          </label>
        </div>

        <div className="flex gap-2 flex-col sm:flex-row mt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
          >
            บันทึกฉบับร่าง
          </button>

          <button
            type="button"
            onClick={handleSubmitToAdvisor}
            className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded"
          >
            ส่งให้ที่ปรึกษา
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-1 space-y-1">
          <span>
            * หมายเหตุ: บันทึกฉบับร่างอัปไฟล์ไม่ครบได้ แต่ “ส่งให้ที่ปรึกษา”
            ต้องครบทุกไฟล์
          </span>
          <span className="block">
            ฟังก์ชันอัปโหลดจะต้องมี Student ID ที่ผ่านการอนุมัติแล้วเท่านั้น
            กรุณาติดต่ออาจารย์หรือผู้ดูแลระบบเพื่อขออนุมัติ Student ID ของคุณก่อนใช้งานฟังก์ชันนี้
          </span>
        </p>
      </div>
    </div>
  );
}