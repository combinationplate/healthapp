import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const ADMIN_EMAILS = ["ztaylor120@gmail.com"];

export default async function AdminBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/app");
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: sends } = await admin
    .from("ce_sends")
    .select(`
      id, created_at, clicked_at, course_name, course_hours,
      coupon_code, source, billed, recipient_email, rep_id,
      professional_id, discount
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  const repIds = [...new Set((sends ?? []).map((s) => s.rep_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, org_id")
    .in("id", repIds.length > 0 ? repIds : ["none"]);

  const orgIds = [
    ...new Set((profiles ?? []).map((p) => p.org_id).filter(Boolean)),
  ];
  const { data: orgs } = await admin
    .from("orgs")
    .select("id, name")
    .in("id", orgIds.length > 0 ? orgIds : ["none"]);

  const { data: authUsers } = await admin.auth.admin.listUsers();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email]));

  const rows = (sends ?? []).map((s) => {
    const profile = profileMap.get(s.rep_id);
    const orgName = profile?.org_id ? orgMap.get(profile.org_id) ?? "" : "";
    return {
      ...s,
      rep_name: profile?.full_name ?? "Unknown",
      rep_email: emailMap.get(s.rep_id) ?? "",
      org_name: orgName,
      billable: s.clicked_at ? s.course_hours * 15 : 0,
    };
  });

  const totalSent = rows.length;
  const totalAccessed = rows.filter((r) => r.clicked_at).length;
  const totalBillable = rows.reduce((sum, r) => sum + r.billable, 0);
  const totalUnbilled = rows
    .filter((r) => r.clicked_at && !r.billed)
    .reduce((sum, r) => sum + r.billable, 0);

  const orgSummary = new Map<
    string,
    { sent: number; accessed: number; billable: number; reps: Set<string> }
  >();
  for (const r of rows) {
    const key = r.org_name || r.rep_name;
    if (!orgSummary.has(key)) {
      orgSummary.set(key, {
        sent: 0,
        accessed: 0,
        billable: 0,
        reps: new Set(),
      });
    }
    const s = orgSummary.get(key)!;
    s.sent++;
    if (r.clicked_at) {
      s.accessed++;
      s.billable += r.billable;
    }
    s.reps.add(r.rep_name);
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = rows.filter(
    (r) => new Date(r.created_at) >= monthStart,
  );
  const monthSent = thisMonth.length;
  const monthAccessed = thisMonth.filter((r) => r.clicked_at).length;
  const monthBillable = thisMonth.reduce((sum, r) => sum + r.billable, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f5f0",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ background: "#0b1222", padding: "20px 24px" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill="#1a2744" />
              <path
                d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                stroke="url(#ab-line)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="ab-line" x1="10" y1="28" x2="46" y2="28">
                  <stop stopColor="#6B8AFF" />
                  <stop offset="1" stopColor="#5EEAD4" />
                </linearGradient>
              </defs>
            </svg>
            <span
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: "20px",
                fontWeight: 900,
                color: "#fff",
              }}
            >
              Pulse Admin
            </span>
          </div>
          <a
            href="/app"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}
      >
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "#0b1222",
            marginBottom: "24px",
          }}
        >
          Billing Overview
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            { label: "Total Sent", value: totalSent, sub: "All time" },
            {
              label: "Accessed",
              value: totalAccessed,
              sub: `${
                totalSent > 0
                  ? Math.round((totalAccessed / totalSent) * 100)
                  : 0
              }% rate`,
            },
            {
              label: "Total Billable",
              value: `$${totalBillable.toFixed(2)}`,
              sub: "All time",
            },
            {
              label: "Unbilled",
              value: `$${totalUnbilled.toFixed(2)}`,
              sub: "Accessed but not invoiced",
            },
            {
              label: "This Month Sent",
              value: monthSent,
              sub: new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
            },
            {
              label: "This Month Billable",
              value: `$${monthBillable.toFixed(2)}`,
              sub: `${monthAccessed} accessed`,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid rgba(11,18,34,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0b1222",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#3b4963",
                  marginTop: "4px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#7a8ba8",
                  marginTop: "2px",
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "18px",
            fontWeight: 800,
            color: "#0b1222",
            marginBottom: "14px",
          }}
        >
          By Company
        </h2>
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid rgba(11,18,34,0.08)",
            overflow: "hidden",
            marginBottom: "32px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid rgba(11,18,34,0.08)",
                  background: "#f6f5f0",
                }}
              >
                {[
                  "Company / Rep",
                  "Reps",
                  "Sent",
                  "Accessed",
                  "Billable",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#7a8ba8",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...orgSummary.entries()]
                .sort((a, b) => b[1].billable - a[1].billable)
                .map(([name, s]) => (
                  <tr
                    key={name}
                    style={{
                      borderBottom: "1px solid rgba(11,18,34,0.04)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 600,
                        color: "#0b1222",
                      }}
                    >
                      {name}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#7a8ba8",
                      }}
                    >
                      {s.reps.size}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#3b4963",
                      }}
                    >
                      {s.sent}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#3b4963",
                      }}
                    >
                      {s.accessed}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "#0b1222",
                      }}
                    >
                      ${s.billable.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "18px",
            fontWeight: 800,
            color: "#0b1222",
            marginBottom: "14px",
          }}
        >
          All CE Sends
        </h2>
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid rgba(11,18,34,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid rgba(11,18,34,0.08)",
                    background: "#f6f5f0",
                  }}
                >
                  {[
                    "Date",
                    "Rep",
                    "Rep Email",
                    "Org",
                    "Professional",
                    "Course",
                    "Hrs",
                    "Source",
                    "Status",
                    "Billable",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#7a8ba8",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid rgba(11,18,34,0.04)",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#7a8ba8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 600,
                        color: "#0b1222",
                      }}
                    >
                      {r.rep_name}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#7a8ba8",
                        fontSize: "11px",
                      }}
                    >
                      {r.rep_email}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#3b4963",
                      }}
                    >
                      {r.org_name || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#3b4963",
                      }}
                    >
                      {r.recipient_email || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#3b4963",
                        maxWidth: "180px",
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.course_name}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#7a8ba8",
                        textAlign: "center",
                      }}
                    >
                      {r.course_hours}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background:
                            r.source === "qr"
                              ? "rgba(36,85,255,0.10)"
                              : r.source === "bulk"
                              ? "#EDE9FE"
                              : "#f0efeb",
                          color:
                            r.source === "qr"
                              ? "#2455ff"
                              : r.source === "bulk"
                              ? "#6D28D9"
                              : "#3b4963",
                        }}
                      >
                        {r.source ?? "manual"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                      }}
                    >
                      {r.clicked_at ? (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "rgba(13,148,136,0.10)",
                            color: "#0d9488",
                          }}
                        >
                          Accessed
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "#f0efeb",
                            color: "#7a8ba8",
                          }}
                        >
                          Sent
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 700,
                        color: r.billable > 0 ? "#0b1222" : "#7a8ba8",
                      }}
                    >
                      ${r.billable.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

