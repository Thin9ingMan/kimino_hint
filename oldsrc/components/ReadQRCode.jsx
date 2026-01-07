//将来的な置き換え
// handleMockScan関数→実際のQRコード読み取り処理
//mockRoomId→QRコード解析結果
//alert→ルーム画面遷移orstate管理

import { useState } from "react";

export default function ReadQRCode() {
  const [scanned, setScanned] = useState(false);
  const [roomId, setRoomId] = useState(null);

  const handleMockScan = () => {
    const mockRoomId = "ROOM-1234";
    setRoomId(mockRoomId);
    setScanned(true);
  };

  return (
    <div>
      <h1>ルームに参加</h1>

      {!scanned && (
        <div>
          <p>QRコードをカメラ枠の中に合わせてください</p>

          <div>
            <p>（ここにカメラ映像が表示されます）</p>
            <p>［ QRコード読み取りエリア ］</p>
          </div>

          <button onClick={handleMockScan}>
            QRを読み取ったことにする（仮）
          </button>
        </div>
      )}

      {scanned && (
        <div>
          <p>QRコードを読み取りました！</p>
          <p>ルームID: {roomId}</p>

          <button onClick={() => alert("ルーム参加処理へ")}>
            ルームに参加する
          </button>
        </div>
      )}
    </div>
  );
}