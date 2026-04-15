"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Lead = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const campaignId = useMemo(() => Number(params.id), [params.id]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      localStorage.removeItem("token");
      router.push("/login");
      return null;
    }
    return token;
  }, [router]);

  const loadLeads = useCallback(async (nextPage = page, nextEmail = email) => {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(
      `/api/campaigns/${campaignId}/leads?page=${nextPage}&limit=20&email=${encodeURIComponent(nextEmail)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (res.ok) {
      setLeads(data.data.items);
      setTotal(data.data.total);
      setPage(data.data.page);
    }
  }, [campaignId, email, page, getAuthToken]);

  useEffect(() => {
    if (campaignId) loadLeads(1, "");
  }, [campaignId, loadLeads]);

  async function uploadCsv(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !file.name.endsWith(".csv")) {
      setMessage("Only .csv is allowed");
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/campaigns/${campaignId}/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Import failed");
      return;
    }
    setJobId(data.data.jobId);
    setMessage("Import job queued");
  }

  async function checkJob() {
    if (!jobId) return;
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/campaigns/${campaignId}/import?jobId=${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMessage(`Import status: ${data.data.status}`);
    if (data.data.status === "completed") {
      loadLeads();
    }
  }

  return (
    <section className="space-y-4">
      <div className="card">
        <h1 className="display-1">Campaign #{campaignId}</h1>
      </div>

      <form className="card flex gap-2 items-center" onSubmit={uploadCsv} aria-label="Upload csv">
        <input type="file" name="file" accept=".csv" aria-label="CSV file" />
        <button className="btn btn-primary" type="submit">
          Upload CSV
        </button>
        <button className="btn btn-ghost" type="button" onClick={checkJob}>
          Check import status
        </button>
      </form>

      <div className="card flex gap-2">
        <input
          placeholder="Search email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Search by email"
        />
        <button className="btn btn-primary" onClick={() => loadLeads(1, email)}>
          Search
        </button>
      </div>

      <div className="table-wrap">
        <table aria-label="Leads table">
          <thead>
            <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Imported At</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t">
              <td>{lead.email}</td>
              <td>{lead.name || "-"}</td>
              <td>{new Date(lead.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="card flex gap-2">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => loadLeads(page - 1, email)}>
          Prev
        </button>
        <span>
          Page {page} / {Math.max(1, Math.ceil(total / 20))}
        </span>
        <button
          className="btn btn-ghost"
          disabled={page >= Math.ceil(total / 20)}
          onClick={() => loadLeads(page + 1, email)}
        >
          Next
        </button>
      </div>

      {message && <p>{message}</p>}
    </section>
  );
}
