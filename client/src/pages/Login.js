import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    }

    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 4) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
  setLoginSuccess(true);

  // บันทึก role + token
  localStorage.setItem("role", data.role);
  if (data.token) localStorage.setItem("token", data.token);

  // ✅ เก็บ userId ด้วย
  if (data.userId) localStorage.setItem("userId", data.userId);

  // Redirect ตาม role
  setTimeout(() => {
    setLoginSuccess(false);
    if (data.role === "admin") navigate("/admin");
    else if (data.role === "student") navigate("/home");
    else if (data.role === "teacher") navigate("/home");
    else navigate("/");
  }, 1200);
} else {
        setErrors({ password: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
      setErrors({ password: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 to-yellow-400 ">
      <div className="bg-yellow-200 p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center justify-center border-4 border-yellow-400">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h2>
            <p className="text-gray-600">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Success Message */}
          {loginSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">เข้าสู่ระบบสำเร็จ!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-yellow-50/80 p-6 rounded-xl shadow-inner border-2 border-yellow-300">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`block w-full pl-3 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="กรอกชื่อผู้ใช้"
                />
                {errors.username && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <span>{errors.username}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="กรอกรหัสผ่าน"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 transition-colors duration-200"
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5 text-gray-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Forgot Password only */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                onClick={async () => {
                  const username = prompt('ระบุชื่อผู้ใช้เพื่อรีเซ็ตรหัสผ่าน');
                  if (!username) return;
                  try {
                    const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) return alert(data.message || 'ส่งรหัสรีเซ็ตไม่สำเร็จ');
                    const code = prompt(`กรอกรหัส OTP ที่ได้รับ (เดโม: ${data.code})`);
                    if (!code) return;
                    const newPass = prompt('กรอกรหัสผ่านใหม่');
                    if (!newPass) return;
                    const res2 = await fetch('http://localhost:3000/api/auth/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, code, new_password: newPass })
                    });
                    const data2 = await res2.json();
                    if (!res2.ok || !data2.success) return alert(data2.message || 'รีเซ็ตไม่สำเร็จ');
                    alert('รีเซ็ตรหัสผ่านสำเร็จ ลองเข้าสู่ระบบใหม่');
                  } catch (e) {
                    console.error(e);
                    alert('เกิดข้อผิดพลาด');
                  }
                }}
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <LogIn className="w-5 h-5" />
                  <span>เข้าสู่ระบบ</span>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชีใช่ไหม?{' '}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
                ลงทะเบียนที่นี่
              </button>

            </p>
          </div>
        </div>
      </div>
    </div>
  );
}