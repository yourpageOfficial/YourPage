"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>😵</p>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Terjadi Kesalahan</h2>
        <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Coba refresh halaman.</p>
        <button onClick={reset} style={{ padding: "0.5rem 1.5rem", borderRadius: "0.75rem", background: "#EC4899", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>
          Refresh
        </button>
      </div>
    </div>
  );
}
