import { useState, useEffect } from "react";
import { apis } from "../api/client";
import { useNavigate, useLocation } from "react-router-dom";

export default function MakeQRCode() {
  const [showQRCode, setShowQRCode] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const eventId = location.state?.eventId;

  useEffect(() => {
    // If eventId is provided, fetch the event data
    if (eventId) {
      fetchEventData(eventId);
    }
  }, [eventId]);

  const fetchEventData = async (id) => {
    try {
      const event = await apis.events().getEventById({ id });
      setEventData(event);
    } catch (err) {
      console.error("Failed to fetch event data:", err);
      setError("イベントデータの取得に失敗しました");
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let event = eventData;
      
      // If no event exists, create a new one
      if (!event) {
        const newEvent = await apis.events().createEvent({
          eventCreateRequest: {
            title: `イベント ${new Date().toLocaleString('ja-JP')}`,
            startAt: new Date().toISOString(),
          }
        });
        event = newEvent;
        setEventData(newEvent);
      }

      // Generate QR code URL with join code
      // Using a free QR code API service
      const joinUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/'}read_qr?code=${event.joinCode}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
      
      setQrCodeUrl(qrUrl);
      setShowQRCode(true);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      setError("QRコードの生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `event-qr-${eventData?.id || 'code'}.png`;
    link.click();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>QRコード発行</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}

      {eventData && !showQRCode && (
        <div style={{ marginBottom: "20px" }}>
          <p><strong>イベント名:</strong> {eventData.title}</p>
          <p><strong>参加コード:</strong> {eventData.joinCode}</p>
        </div>
      )}

      {/* 発行ボタンはQR表示前のみ */}
      {!showQRCode && (
        <button 
          onClick={handleGenerate} 
          style={{ marginBottom: "20px" }}
          disabled={loading}
        >
          {loading ? "生成中..." : "発行"}
        </button>
      )}

      {showQRCode && (
        <div>
          <p>QRコードが発行されました</p>
          {eventData && (
            <div style={{ marginBottom: "10px" }}>
              <p><strong>イベント名:</strong> {eventData.title}</p>
              <p><strong>参加コード:</strong> {eventData.joinCode}</p>
            </div>
          )}
          {/* QRコード画像を中央表示 */}
          <img
            src={qrCodeUrl}
            alt="QRコード"
            style={{ display: "block", margin: "0 auto", width: "300px", height: "300px" }}
          />
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={handleDownload}>ダウンロード</button>
            <button onClick={() => navigate("/")}>ホームへ戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}
