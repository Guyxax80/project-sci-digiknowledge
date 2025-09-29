import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:3000/api/auth/me", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login"); // เปลี่ยนเป็นหน้า login ของคุณ
  };

  if (loading) return <p className="p-4">กำลังโหลด...</p>;

  if (!user)
    return (
      <div className="p-4 text-center">
        <p>ยังไม่ได้เข้าสู่ระบบ</p>
      </div>
    );

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">โปรไฟล์ผู้ใช้งาน</h1>

      <div className="space-y-2">
        <p>
          <span className="font-semibold">Username:</span> {user.username}
        </p>
        <p>
          <span className="font-semibold">Role:</span> {user.role}
        </p>
        <p>
          <span className="font-semibold">Student ID:</span> {user.student_id || "-"}
        </p>
        <p>
          <span className="font-semibold">Class Group:</span> {user.class_group || "-"}
        </p>
        <p>
          <span className="font-semibold">Level:</span> {user.level || "-"}
        </p>
        {/*<p className="text-gray-500 text-sm mt-2">
          Created At: {new Date(user.created_at).toLocaleString()}
        </p>*/}
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Profile;
