"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Campaign = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

const statuses = ["draft", "running", "paused", "completed", "archived"];

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function getAuthToken() {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      localStorage.removeItem("token");
      router.push("/login");
      return null;
    }
    return token;
  }

  async function loadCampaigns() {
    const token = getAuthToken();
    if (!token) return;
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
    const token = getAuthToken();
    if (!token) return;
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
    const token = getAuthToken();
    if (!token) return;
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
    const token = getAuthToken();
    if (!token) return;
    await fetch(`/api/campaigns/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    await loadCampaigns();
  }

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="display-1">Campaign Management</h1>
        <p className="text-muted">Create and manage campaign status in real time.</p>
      </div>
      <form onSubmit={createCampaign} className="card grid-12" aria-label="Create campaign">
        <div className="col-6">
          <input
            placeholder="Campaign name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Campaign name"
          />
        </div>
        <div className="col-6">
          <button className="btn btn-primary" type="submit">
            Create campaign
          </button>
        </div>
      </form>

      <div className="table-wrap">
        <table aria-label="Campaigns table">
          <thead>
            <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>
                <Link className="text-blue-700 hover:underline" href={`/campaigns/${c.id}`}>
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
                <button className="btn btn-danger" onClick={() => removeCampaign(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </section>
  );
}
