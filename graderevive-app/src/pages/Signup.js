// src/pages/Signup.js
import React, { useState } from 'react';
import { signup } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(email, password);
      if (data.success) {
        alert("회원가입 성공! 로그인해주세요.");
        navigate('/login');
      } else {
        alert("회원가입 실패: " + data.error);
      }
    } catch (err) {
      alert("오류: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>회원가입</h2>
      <form onSubmit={handleSignup}>
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">회원가입</button>
      </form>
    </div>
  );
}
