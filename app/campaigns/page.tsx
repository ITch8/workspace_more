"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Campaign = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

const statuses = ["draft", "running", "paused", "completed", "archived"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function loadCampaigns() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/campaigns", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Failed to load campaigns");
      return;
    }
    setCampaigns(data.data);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Create failed");
      return;
    }
    setName("");
    await loadCampaigns();
  }

  async function updateStatus(id: number, status: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    await loadCampaigns();
  }

  async function removeCampaign(id: number) {
    const token = localStorage.getItem("token");
    await fetch(`/api/campaigns/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    await loadCampaigns();
  }

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Campaign Management</h1>
      <form onSubmit={createCampaign} className="flex gap-2">
        <input
          placeholder="Campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="bg-slate-900 text-white" type="submit">
          Create
        </button>
      </form>

      <table className="w-full bg-white">
        <thead>
          <tr className="text-left">
            <th>Name</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-t">
              <td>
                <Link className="underline" href={`/campaigns/${c.id}`}>
                  {c.name}
                </Link>
              </td>
              <td>
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => removeCampaign(c.id)} className="text-red-600">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="text-red-600">{error}</p>}
    </section>
  );
}
