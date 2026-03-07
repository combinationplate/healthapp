export default function SignupConfirmPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✉️</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Check your email</h1>
        <p style={{ color: "#64748B", fontSize: "15px" }}>We sent a confirmation link to your email. Click it to activate your account.</p>
      </div>
    </div>
  );
}
