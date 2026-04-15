"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Login failed");
      return;
    }
    const token = data?.data?.token;
    if (!token || typeof token !== "string") {
      setError("Login response missing token");
      return;
    }
    localStorage.setItem("token", token);
    router.push("/campaigns");
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-3" aria-label="Login form">
      <h1 className="display-1">Sign in</h1>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        aria-label="Password"
      />
      <button type="submit" className="btn btn-primary">
        Login
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
