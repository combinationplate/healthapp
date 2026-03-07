"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const DISCIPLINES = ["Nursing", "Social Work", "Case Management", "PT", "OT", "ST"];

type Course = {
  id: string;
  name: string;
  hours: number;
  topic: string | null;
};

type RepInfo = {
  name: string;
  company: string;
};

export default function CELandingPage() {
  const params = useParams();
  const repId = params.repId as string;
  const courseId = params.courseId as string | undefined;

  const [repInfo, setRepInfo] = useState<RepInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [discipline, setDiscipline] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ce/landing?repId=${repId}${courseId ? `&courseId=${courseId}` : ""}`)
      .then(r => r.json())
      .then(data => {
        setRepInfo(data.rep);
        setCourses(data.courses ?? []);
        if (data.preselectedCourse) setSelectedCourse(data.preselectedCourse);
        setLoading(false);
      });
  }, [repId, courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse && courses.length > 1) {
      setError("Please select a course.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/ce/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repId,
        courseId: selectedCourse || courses[0]?.id,
        email,
        name,
        discipline,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSuccess(true);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
        <p style={{ color: "#64748B" }}>Loading…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
        <div style={{ textAlign: "center", padding: "40px", maxWidth: "400px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Check your email!</h1>
          <p style={{ color: "#64748B", fontSize: "15px" }}>Your free CE course is on its way. Check your inbox for the coupon code and access link.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px", background: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📚</div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Get a Free CE Course</h1>
          {repInfo && (
            <p style={{ color: "#64748B", fontSize: "14px" }}>
              Compliments of <strong>{repInfo.name}</strong>{repInfo.company ? ` · ${repInfo.company}` : ""}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jennifer Lopez, RN"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jennifer@hospital.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Your Discipline</label>
            <select
              required
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
            >
              <option value="">Select…</option>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {courses.length > 1 && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Select a Course</label>
              <select
                required
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
              >
                <option value="">Choose a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.hours} hrs)</option>
                ))}
              </select>
            </div>
          )}

          {courses.length === 1 && (
            <div style={{ padding: "12px", background: "#F0F9FF", borderRadius: "8px", border: "1px solid #BAE6FD" }}>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{courses[0].name}</div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{courses[0].hours} hrs · {courses[0].topic}</div>
            </div>
          )}

          {error && <p style={{ fontSize: "13px", color: "#EF4444" }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "14px", borderRadius: "8px", border: "none", background: "#2D5BFF", color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Sending…" : "Get My Free CE →"}
          </button>
          <p style={{ fontSize: "11px", color: "#94A3B8", textAlign: "center" }}>No account required. Course delivered by email.</p>
        </form>
      </div>
    </div>
  );
}
