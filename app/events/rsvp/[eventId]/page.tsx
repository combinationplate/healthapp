import { createClient } from "@/lib/supabase/server";
import { RSVPClientButtons } from "./RSVPButtons";

export default async function RSVPPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ email?: string; action?: string }>;
}) {
  const { eventId } = await params;
  const { email, action } = await searchParams;
  const supabase = await createClient();

  // event row has rep_name, rep_org denormalized — no joins needed
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event || event.status === "cancelled") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'DM Sans',system-ui,sans-serif",
        background: "#f6f5f0",
      }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0b1222" }}>
            Event Not Found
          </h1>
          <p style={{ color: "#7a8ba8", marginTop: "8px" }}>
            This event may have been cancelled or removed.
          </p>
        </div>
      </div>
    );
  }

  const repName = event.rep_name ?? "A Pulse rep";
  const orgName = event.rep_org ?? "";

  const eventDate = new Date(event.starts_at).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const eventTime = new Date(event.starts_at).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
  const typeLabels: Record<string, string> = {
    lunch_and_learn: "Lunch & Learn", networking_dinner: "Networking Dinner",
    workshop: "Workshop", in_service: "In-Service", other: "Event",
  };

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif",
      background: "#f6f5f0", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        width: "100%", maxWidth: "480px", background: "#fff",
        borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#0b1222,#1a2744)",
          padding: "28px 32px",
        }}>
          <div style={{
            fontSize: "11px", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)",
            marginBottom: "4px",
          }}>
            {typeLabels[event.event_type] || "Event"}
          </div>
          <h1 style={{
            fontFamily: "Georgia,serif", fontSize: "22px", fontWeight: 800,
            color: "#fff", margin: "0 0 8px", lineHeight: 1.2,
          }}>
            {event.title}
          </h1>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
            Hosted by {repName}{orgName ? ` · ${orgName}` : ""}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 32px" }}>
          <div style={{
            background: "#f6f5f0", borderRadius: "12px", padding: "16px",
            marginBottom: "24px",
          }}>
            <div style={{
              fontSize: "14px", fontWeight: 600, color: "#0b1222",
              marginBottom: "4px",
            }}>
              📅 {eventDate} at {eventTime}
            </div>
            <div style={{ fontSize: "13px", color: "#7a8ba8" }}>
              ⏱ {event.duration_minutes} minutes
            </div>
            {event.location_name && (
              <div style={{ fontSize: "13px", color: "#3b4963", marginTop: "4px" }}>
                📍 {event.location_name}
                {event.address && (
                  <span style={{ color: "#7a8ba8" }}> · {event.address}</span>
                )}
              </div>
            )}
          </div>

          {event.description && (
            <p style={{
              fontSize: "14px", color: "#3b4963", lineHeight: 1.6,
              marginBottom: "24px",
            }}>
              {event.description}
            </p>
          )}

          {event.external_url && (
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <a
                href={event.external_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", background: "#2455ff", color: "#fff",
                  fontWeight: 700, padding: "14px 40px", borderRadius: "10px",
                  fontSize: "15px", textDecoration: "none",
                  boxShadow: "0 2px 10px rgba(36,85,255,0.18)",
                }}
              >
                View Details & Sign Up →
              </a>
            </div>
          )}

          <RSVPClientButtons
            eventId={eventId}
            email={email ?? ""}
            initialAction={action ?? null}
            hasExternalUrl={!!event.external_url}
          />
        </div>

        <div style={{
          padding: "16px 32px", fontSize: "11px", color: "#7a8ba8",
          textAlign: "center", borderTop: "1px solid rgba(11,18,34,0.06)",
          background: "#fafaf7",
        }}>
          Sent via <strong>Pulse</strong> · pulsereferrals.vercel.app
        </div>
      </div>
    </div>
  );
}
