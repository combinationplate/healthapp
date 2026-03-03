"use client";

import React from "react";
import { useState, useEffect } from "react";
import { StatCard, StatsGrid, PageShell, SectionCard, TabBar } from "./DashboardShell";

const PRO_TABS = [
  { id: "courses", label: "CE Courses" },
  { id: "network", label: "Network" },
] as const;

type ProTab = (typeof PRO_TABS)[number]["id"];

type MyCourseRow = {
  id: string;
  courseName: string;
  courseHours: number;
  sentBy: string;
  sentAt: string;
  expiryAt: string;
  redeemUrl: string | null;
  redeemedAt: string | null;
};

const BTN_PRIMARY = "rounded-lg bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] transition-colors shadow-sm";
const BTN_SECONDARY = "rounded-lg border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC] transition-colors";

function displayName(nameOrEmail: string): string {
  if (!nameOrEmail) return "there";
  const trimmed = nameOrEmail.trim();
  if (trimmed.includes("@")) return trimmed.split("@")[0];
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function ProDashboard({ userName, userId }: { userName?: string | null; userId?: string }) {
  const [tab, setTab] = useState<ProTab>("courses");
  const welcomeName = displayName(userName ?? "");
  const [myCourses, setMyCourses] = useState<MyCourseRow[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(false);
  const [myCoursesExpanded, setMyCoursesExpanded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
const [needsOnboarding, setNeedsOnboarding] = useState(false);
const [onboardingForm, setOnboardingForm] = useState({
  discipline: "",
  state: "",
  city: "",
  facility: "",
});
const [onboardingSaving, setOnboardingSaving] = useState(false);
const [requestOpen, setRequestOpen] = useState(false);
const [requestForm, setRequestForm] = useState({
  topic: "",
  hours: "2",
  deadline: "",
  notes: "",
  visible: false,
  repId: "",
});
const [requestSaving, setRequestSaving] = useState(false);
const [requestSuccess, setRequestSuccess] = useState(false);
const [myRequests, setMyRequests] = useState<{id: string; topic: string; hours: number; deadline: string; status: string; created_at: string}[]>([]);
const [connectedReps, setConnectedReps] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    let cancelled = false;
    setMyCoursesLoading(true);
    fetch("/api/ce/my-courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.list) setMyCourses(data.list);
      })
      .finally(() => { if (!cancelled) setMyCoursesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const refreshMyCourses = () => {
    fetch("/api/ce/my-courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.list) setMyCourses(data.list); });
  };

  async function handleMarkRedeemed(ceSendId: string) {
    const res = await fetch("/api/ce/mark-redeemed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ceSendId }),
    });
    if (res.ok) refreshMyCourses();
  }
  useEffect(() => {
    fetch("/api/pro/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && !data.profile.discipline) {
          setNeedsOnboarding(true);
        }
        setProfileLoading(false);
      });
  }, []);
  
  useEffect(() => {
    if (!userId) return;
    fetch("/api/pro/requests", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.requests) setMyRequests(data.requests);
        if (data.reps) setConnectedReps(data.reps);
      });
  }, [userId]);
  
  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setOnboardingSaving(true);
    const res = await fetch("/api/pro/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(onboardingForm),
    });
    setOnboardingSaving(false);
    if (res.ok) setNeedsOnboarding(false);
  }
  
  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    setRequestSaving(true);
    const res = await fetch("/api/pro/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(requestForm),
    });
    setRequestSaving(false);
    if (res.ok) {
      setRequestSuccess(true);
      const data = await res.json();
      if (data.request) setMyRequests((prev) => [data.request, ...prev]);
      setTimeout(() => {
        setRequestOpen(false);
        setRequestSuccess(false);
        setRequestForm({ topic: "", hours: "2", deadline: "", notes: "", visible: false, repId: "" });
      }, 1500);
    }
  }
  const showMyCoursesCount = 3;
  const myCoursesVisible = myCoursesExpanded ? myCourses : myCourses.slice(0, showMyCoursesCount);
  const hasMoreMyCourses = myCourses.length > showMyCoursesCount && !myCoursesExpanded;

  return (
    <PageShell>
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Welcome, {welcomeName}</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">View your CE courses and network</p>
        </div>

        <div className="rounded-xl bg-white border border-[var(--border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <StatsGrid>
            <StatCard
              label="Courses"
              value={myCourses.length}
              note="In My Courses"
              noteClass="text-[var(--green)]"
            />
            <StatCard
              label="CE Hours"
              value={myCourses.reduce((acc, c) => acc + c.courseHours, 0)}
              note="Completed"
              noteClass="text-[var(--green)]"
            />
            <StatCard
              label="Courses Available"
              value={myCourses.length}
              note="From your reps"
              noteClass="text-[var(--blue)]"
            />
            <StatCard
              label="Reps"
              value="—"
              note="Connected"
              noteClass="text-[var(--blue)]"
            />
          </StatsGrid>
        </div>

        <TabBar tabs={[...PRO_TABS]} active={tab} onChange={(id) => setTab(id as ProTab)} />

        {tab === "courses" && (
          <div className="space-y-6">
            <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Courses</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">CE courses sent to you by your reps</p>
            </div>
            {myCoursesLoading ? (
              <p className="py-6 text-sm text-[var(--ink-muted)]">Loading…</p>
            ) : myCourses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--ink-muted)]">No courses sent to you yet.</p>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When a rep sends you a CE, it will appear here.</p>
                <a href="/app" className={`mt-4 inline-block ${BTN_PRIMARY}`}>Go to Dashboard</a>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {myCoursesVisible.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-[var(--border)] bg-white p-4 mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    >
                      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                        <div>
                          <div className="font-semibold text-[13px] text-[var(--ink)]">{c.courseName}</div>
                          <div className="text-[11px] text-[var(--ink-muted)]">
                            Sent by {c.sentBy} · {formatDate(c.sentAt)} · Expires {formatDate(c.expiryAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {c.redeemedAt ? (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">
                                Redeemed
                              </span>
                              <span className="text-[10px] text-[var(--ink-muted)]">
                                Redeemed {formatDate(c.redeemedAt)}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[#B8860B]">
                                  Pending
                                </span>
                                <a
                                  href={c.redeemUrl || "https://hiscornerstone.com"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`ml-3 ${BTN_PRIMARY}`}
                                >
                                  Redeem Course
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMarkRedeemed(c.id)}
                                className="text-[10px] text-[var(--ink-soft)] hover:underline"
                              >
                                Mark as Redeemed
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreMyCourses && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setMyCoursesExpanded(true)}
                      className={BTN_SECONDARY}
                    >
                      Show more ({myCourses.length - showMyCoursesCount} more)
                    </button>
                  </div>
                )}
              </>
            )}
            </SectionCard>

            <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Available CE Courses</h2>
              <button type="button" className={BTN_PRIMARY} onClick={() => setRequestOpen(true)}>+ Request CE</button>
            </div>
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">Browse and request CE courses from your reps.</p>
              <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setRequestOpen(true)}>Request a course</button>
            </div>
            </SectionCard>

            <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Requests</h2>
            </div>
            {myRequests.length === 0 ? (
  <div className="py-8 text-center">
    <p className="text-sm text-[var(--ink-muted)]">No pending requests.</p>
    <button type="button" className={`mt-4 ${BTN_SECONDARY}`} onClick={() => setRequestOpen(true)}>Request CE</button>
  </div>
) : (
  <div className="space-y-3">
    {myRequests.map(r => (
      <div key={r.id} style={{padding:'14px',borderRadius:'10px',border:'1px solid var(--border)',background:'white'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
          <div>
            <div style={{fontWeight:600,fontSize:'13px',color:'var(--ink)'}}>{r.topic}</div>
            <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>{r.hours} hrs · Due {new Date(r.deadline).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
          </div>
          <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background: r.status === 'pending' ? 'var(--gold-glow)' : 'var(--green-glow)',color: r.status === 'pending' ? '#B8860B' : 'var(--green)'}}>{r.status}</span>
        </div>
      </div>
    ))}
  </div>
)}
            </SectionCard>
        </div>
      )}

      {tab === "network" && (
        <SectionCard>
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Network</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Sales reps connected to you</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No reps in your network yet.</p>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When you connect with a rep, they will appear here.</p>
          </div>
        </SectionCard>
      )}
    </div>
    {/* Onboarding Modal */}
{!profileLoading && needsOnboarding && (
  <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,18,34,0.6)',backdropFilter:'blur(4px)'}}>
    <div style={{width:'92%',maxWidth:'480px',background:'white',borderRadius:'16px',padding:'32px',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
      <h3 style={{fontSize:'20px',fontWeight:700,color:'var(--ink)',marginBottom:'6px'}}>Welcome to Pulse</h3>
      <p style={{fontSize:'13px',color:'var(--ink-muted)',marginBottom:'24px'}}>Tell us a bit about yourself so reps can send you the right CE courses.</p>
      <form onSubmit={handleOnboarding} style={{display:'grid',gap:'16px'}}>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Discipline</label>
          <select required value={onboardingForm.discipline} onChange={e => setOnboardingForm(f => ({...f, discipline: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
            <option value="">Select...</option>
            <option value="Nursing">Nursing</option>
            <option value="Social Work">Social Work</option>
            <option value="Case Mgmt">Case Management</option>
            <option value="PT">Physical Therapy</option>
            <option value="OT">Occupational Therapy</option>
            <option value="SLP">Speech-Language Pathology</option>
          </select>
        </div>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Facility</label>
          <input type="text" required value={onboardingForm.facility} onChange={e => setOnboardingForm(f => ({...f, facility: e.target.value}))} placeholder="St. Luke's Hospital" style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>City</label>
            <input type="text" value={onboardingForm.city} onChange={e => setOnboardingForm(f => ({...f, city: e.target.value}))} placeholder="Houston" style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>State</label>
            <select value={onboardingForm.state} onChange={e => setOnboardingForm(f => ({...f, state: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
              <option value="">Select...</option>
              {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={onboardingSaving} style={{padding:'12px',borderRadius:'10px',border:'none',background:'var(--blue)',color:'white',fontSize:'14px',fontWeight:600,cursor:'pointer',opacity:onboardingSaving?0.6:1}}>
          {onboardingSaving ? 'Saving...' : 'Get Started'}
        </button>
      </form>
    </div>
  </div>
)}

{/* Request CE Modal */}
{requestOpen && (
  <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,18,34,0.5)',backdropFilter:'blur(4px)'}} onClick={() => !requestSaving && setRequestOpen(false)}>
    <div style={{width:'92%',maxWidth:'480px',background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e => e.stopPropagation()}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'16px'}}>
        <h3 style={{fontSize:'18px',fontWeight:700,color:'var(--ink)'}}>Request CE Course</h3>
        <button type="button" onClick={() => !requestSaving && setRequestOpen(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'var(--ink-muted)',lineHeight:1}}>×</button>
      </div>
      {requestSuccess ? (
        <div style={{padding:'24px',textAlign:'center'}}>
          <div style={{fontSize:'40px',marginBottom:'8px'}}>✓</div>
          <p style={{fontWeight:600,color:'var(--green)'}}>Request submitted!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmitRequest} style={{display:'grid',gap:'16px'}}>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Topic</label>
            <select required value={requestForm.topic} onChange={e => setRequestForm(f => ({...f, topic: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
              <option value="">Select topic...</option>
              <option>Ethics</option>
              <option>Palliative Care</option>
              <option>Mental Health</option>
              <option>Chronic Disease Management</option>
              <option>Patient Safety</option>
              <option>Care Transitions</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Hours needed</label>
              <input type="number" required min="1" max="10" value={requestForm.hours} onChange={e => setRequestForm(f => ({...f, hours: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Deadline</label>
              <input type="date" required value={requestForm.deadline} onChange={e => setRequestForm(f => ({...f, deadline: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
            </div>
          </div>
          {connectedReps.length > 0 && (
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Request from specific rep (optional)</label>
              <select value={requestForm.repId} onChange={e => setRequestForm(f => ({...f, repId: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
                <option value="">Any rep in my area</option>
                {connectedReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          <div style={{padding:'12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--bg-light)',cursor:'pointer'}} onClick={() => setRequestForm(f => ({...f, visible: !f.visible}))}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <input type="checkbox" checked={requestForm.visible} onChange={() => {}} style={{width:'16px',height:'16px'}} />
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:'var(--ink)'}}>Make me visible to local reps</div>
                <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>Reps in your area can see your request and send you CEs</div>
              </div>
            </div>
          </div>
          {requestSaving && <p style={{fontSize:'13px',color:'var(--ink-muted)'}}>Submitting...</p>}
          <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
            <button type="button" onClick={() => !requestSaving && setRequestOpen(false)} style={{padding:'10px 20px',borderRadius:'10px',border:'1px solid var(--border)',background:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',color:'var(--ink-soft)'}}>Cancel</button>
            <button type="submit" disabled={requestSaving} style={{padding:'10px 20px',borderRadius:'10px',border:'none',background:'var(--blue)',color:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:requestSaving?0.6:1}}>Submit Request</button>
          </div>
        </form>
      )}
    </div>
  </div>
)}
    </PageShell>
  );
}
  