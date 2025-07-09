// src/pages/Login.js
import React, { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      if (data.token) {
        localStorage.setItem('token', data.token);
        alert("로그인 성공!");
        navigate('/');
      } else {
        alert("로그인 실패: " + data.error);
      }
    } catch (err) {
      alert("오류: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">로그인</button>
      </form>
      <p>계정이 없으신가요? <a href="/signup">회원가입</a></p>
    </div>
  );
}