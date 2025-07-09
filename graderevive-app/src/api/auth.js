// src/api/auth.js
export async function login(email, password) {
  const response = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}
export async function signup(email, password) {
  const response = await fetch("http://localhost:4000/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}
export async function getGpa() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/gpa", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
export async function updateGpa(gpa) {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/gpa", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gpa }),
  });
  return response.json();
}
export async function deleteGpa() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/gpa", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
export async function getUserInfo() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
export async function updateUserInfo(email) {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return response.json();
}
export async function deleteUser() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/user", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
export async function logout() {
  localStorage.removeItem("token");
  return { message: "Logged out successfully" };
}
export async function getProfile() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/user/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
export async function updateProfile(email) {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/user/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return response.json();
}
export async function deleteProfile() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:4000/api/user/profile", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}