"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Register failed");
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-3" aria-label="Register form">
      <h1 className="display-1">Create account</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        aria-label="Password"
      />
      <button type="submit" className="btn btn-primary">
        Create account
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
