import { useMemo, useState } from "react";

export default function MakeQRCode() {
  const [showQRCode, setShowQRCode] = useState(false);

  // Minimal replacement: generate a QR image via public API from a payload.
  // Payload is a shareable profile URL when possible.
  const qrPayload = useMemo(() => {
    const basePath = String(import.meta.env.BASE_URL || "/");
    const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;

    // If we can infer userId from localStorage/token etc in the future, plug it here.
    // For now keep it deterministic and still valid as a page URL.
    return `${window.location.origin}${normalizedBase}me/profile`;
  }, []);

  const qrImageUrl = useMemo(() => {
    const data = encodeURIComponent(qrPayload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
  }, [qrPayload]);

  const handleGenerate = () => {
    setShowQRCode(true);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>QRコード発行</h1>

      {/* 発行ボタンはQR表示前のみ */}
      {!showQRCode && (
        <button onClick={handleGenerate} style={{ marginBottom: "20px" }}>
          発行
        </button>
      )}

      {showQRCode && (
        <div>
          <p>QRコードが発行されました</p>
          <img
            src={qrImageUrl}
            alt="QRコード"
            style={{ display: "block", margin: "0 auto", width: "200px", height: "200px" }}
          />
        </div>
      )}
    </div>
  );
}
