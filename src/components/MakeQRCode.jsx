import { useState } from "react";

// QRコード画像は src/assets に置く想定
import sampleQRCode from "../assets/sample-qr.png";

export default function MakeQRCode() {
  const [showQRCode, setShowQRCode] = useState(false);

  const handleGenerate = () => {
    // ボタン押したらQR表示
    setShowQRCode(true);
  };

  const handleDownload = () => {
    // 画像をダウンロード
    const link = document.createElement("a");
    link.href = sampleQRCode;
    link.download = "qr_code.png"; // ダウンロード時のファイル名
    link.click();
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
          {/* QRコード画像を中央表示 */}
          <img
            src={sampleQRCode}
            alt="QRコード"
            style={{ display: "block", margin: "0 auto", width: "200px", height: "200px" }}
          />
         
        </div>
      )}
    </div>
  );
}
