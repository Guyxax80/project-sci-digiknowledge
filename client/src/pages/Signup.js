import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    student_id: "",
    password: "",
    class_group: "",
    level: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "กรุณากรอกชื่อผู้ใช้";
    if (!formData.password) newErrors.password = "กรุณากรอกรหัสผ่าน";
    else if (formData.password.length < 4)
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
    if (formData.level && isNaN(Number(formData.level))) newErrors.level = "ชั้นปีต้องเป็นตัวเลข";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setSignupSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setErrors({ username: data.message || "สมัครไม่สำเร็จ" });
      }
    } catch (err) {
      console.error("Signup error:", err);
      setIsLoading(false);
      setErrors({ username: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-200 to-green-400">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md border-4 border-green-400">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">สมัครสมาชิก</h2>
          <p className="text-gray-600">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>
        </div>

        {signupSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              สมัครสมาชิกสำเร็จ! กำลังพาไปที่หน้าเข้าสู่ระบบ...
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-green-50/80 p-6 rounded-xl shadow-inner border-2 border-green-300"
        >
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className={`block w-full px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.username ? "border-red-300 focus:ring-red-500" : "border-gray-300"
              }`}
              placeholder="กรอกชื่อผู้ใช้"
            />
            {errors.username && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" /> <span>{errors.username}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`block w-full px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.password ? "border-red-300 focus:ring-red-500" : "border-gray-300"
              }`}
              placeholder="กรอกรหัสผ่าน"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" /> <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student ID (ถ้ามี)</label>
            <input
              type="text"
              value={formData.student_id}
              onChange={(e) => handleInputChange("student_id", e.target.value)}
              className="block w-full px-3 py-3 border rounded-xl shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="เช่น 6501234567"
            />
          </div>

          {/* Class Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">กลุ่มชั้นเรียน (class_group)</label>
            <input
              type="text"
              value={formData.class_group}
              onChange={(e) => handleInputChange("class_group", e.target.value)}
              className="block w-full px-3 py-3 border rounded-xl shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="เช่น CS1, CS2"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชั้นปี (level)</label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => handleInputChange("level", e.target.value)}
              className={`block w-full px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.level ? "border-red-300 focus:ring-red-500" : "border-gray-300"
              }`}
              placeholder="เช่น 1, 2, 3, 4"
              min="1"
            />
            {errors.level && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" /> <span>{errors.level}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-70"
          >
            {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            มีบัญชีแล้วใช่ไหม?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}