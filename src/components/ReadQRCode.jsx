import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apis } from "../api/client";

export default function ReadQRCode() {
  const [scanned, setScanned] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if code is provided via URL query parameter (from QR scan)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleJoinByCode(code);
    }
  }, [searchParams]);

  const handleJoinByCode = async (joinCode) => {
    setLoading(true);
    setError(null);
    try {
      // Join the event using the join code
      const event = await apis.events().joinEventByCode({ 
        eventJoinRequest: { joinCode } 
      });
      
      setEventData(event);
      setScanned(true);
      
      // Auto-create friendships with other participants in the same event
      // Note: Auto-friendship creation would happen here if backend API supported it
      // await createFriendshipsWithEventParticipants(event.id);
    } catch (err) {
      console.error("Failed to join event:", err);
      setError("イベントへの参加に失敗しました。参加コードを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  // This function would auto-create friendships with event participants
  // Currently not called because backend API for listing event participants is not yet available
  // Uncomment the call above when the backend endpoint is ready
  const createFriendshipsWithEventParticipants = async (eventId) => {
    try {
      // When backend API is ready, implement:
      // 1. Fetch event participants: const participants = await apis.events().getEventParticipants({ eventId });
      // 2. For each participant (except self): await apis.friendships().createFriendship({ friendshipCreateRequest: { toUserId: participant.id } });
      console.log("Auto-friendship creation ready for backend API:", eventId);
    } catch (err) {
      console.error("Failed to create friendships:", err);
      // Don't show error to user as this is a background operation
    }
  };

  const handleMockScan = () => {
    // For testing: use a mock join code
    const mockCode = "ROOM-1234";
    setManualCode(mockCode);
    handleJoinByCode(mockCode);
  };

  const handleManualJoin = () => {
    if (manualCode.trim()) {
      handleJoinByCode(manualCode.trim());
    }
  };

  const handleProceedToQuiz = () => {
    // Navigate to the quiz/profile selection page
    navigate("/profile_history", { state: { eventId: eventData?.id } });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>ルームに参加</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}

      {loading && (
        <div style={{ marginTop: "20px" }}>
          <p>イベントに参加中...</p>
        </div>
      )}

      {!scanned && !loading && (
        <div>
          <p>QRコードをカメラ枠の中に合わせてください</p>

          <div style={{ margin: "20px auto", padding: "20px", border: "2px dashed #ccc", maxWidth: "400px" }}>
            <p>（ここにカメラ映像が表示されます）</p>
            <p>［ QRコード読み取りエリア ］</p>
          </div>

          <div style={{ marginTop: "20px" }}>
            <p>または、参加コードを直接入力：</p>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="参加コードを入力"
              style={{ padding: "8px", fontSize: "16px", marginRight: "10px" }}
            />
            <button onClick={handleManualJoin} disabled={!manualCode.trim()}>
              参加
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handleMockScan}>
              QRを読み取ったことにする（仮）
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={() => navigate("/")}>
              ホームへ戻る
            </button>
          </div>
        </div>
      )}

      {scanned && eventData && (
        <div>
          <p>QRコードを読み取りました！</p>
          <div style={{ marginBottom: "20px" }}>
            <p><strong>イベント名:</strong> {eventData.title}</p>
            <p><strong>イベントID:</strong> {eventData.id}</p>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={handleProceedToQuiz}>
              プロフィールクイズへ
            </button>
            <button onClick={() => navigate("/")}>
              ホームへ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}