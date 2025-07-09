import React, { useState } from "react";
import { login } from "../api/auth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const result = await login(email, password);

    if (result.token) {
      localStorage.setItem("token", result.token);
      setMessage("로그인 성공!");
      // 예: 페이지 이동
      // window.location.href = "/dashboard";
    } else {
      setMessage("로그인 실패: " + (result.message || "알 수 없음"));
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">로그인</h2>
      <form onSubmit={handleLogin}>
        <input
          className="border p-2 w-full mb-2"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          type="submit"
        >
          로그인
        </button>
      </form>
      {message && <p className="mt-2 text-center">{message}</p>}
    </div>
  );
}

export default LoginForm;
