import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";
import { ProfileCard } from "./ui/ProfileCard";
import { useState, useEffect, useCallback, useMemo } from "react";
import { apis } from "../api/client";
import Button from "./ui/Button";

const MyProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstTime, setFirstTime] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const myUserId = useMemo(() => {
    const v = profile?.userId;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }, [profile]);

  const qrPayload = useMemo(() => {
    if (!myUserId) return "";
    // QR を読んだらそのままブラウザで開ける「絶対URL」にする（http(s) で始まる文字列）
    // Vite の BASE_URL（サブパス配下のデプロイ）を考慮して必ず末尾スラッシュ付きに整形
    const basePath = String(import.meta.env.BASE_URL || "/");
    const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
    const url = `${window.location.origin}${normalizedBase}profiles/${myUserId}`;
    return url;
  }, [myUserId]);

  const qrImageUrl = useMemo(() => {
    if (!qrPayload) return "";
    const data = encodeURIComponent(qrPayload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
  }, [qrPayload]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // userId は /api/me から取るのが適切（プロフィールの有無に依存しない）
      const me = await apis.auth().getCurrentUser();
      const myId = me?.id;

      // プロフィール本文は /api/me/profile
      const response = await apis.profiles.getMyProfile();
      const profileData = response.profileData || {};

      setProfile({
        ...profileData,
        userId: myId,
        name: profileData.displayName,
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        // 初めてのプロフィール作成フロー
        setProfile(null);
        setFirstTime(true);
      } else {
        console.error("Failed to fetch profile:", err);
        setError("プロフィールの取得に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 404 の場合は初回作成として編集画面へ誘導
  useEffect(() => {
    if (firstTime) {
      navigate("/edit_profile", { replace: true });
    }
  }, [firstTime, navigate]);

  if (loading) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h1 className="pf-title">プロフィール</h1>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h1 className="pf-title">プロフィール</h1>
          <p style={{ color: "red" }}>{error}</p>
          <Button onClick={fetchProfile}>再試行</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h1 className="pf-title">プロフィール</h1>
          <p>プロフィールが存在しません。編集して作成してください。</p>
          <div className="pf-actions">
            <Link to="/edit_profile">
              <button className="pf-btn">プロフィールを作成</button>
            </Link>
            <Link to="/">
              <button className="pf-btn pf-btn-ghost">戻る</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール</h1>
        <ProfileCard profile={profile} />

        <div style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px", color: "#0f172a" }}>プロフィール交換QR</h2>

          {!myUserId && (
            <p style={{ color: "#64748b", margin: 0 }}>
              QRコードを生成するための userId が取得できませんでした。
            </p>
          )}

          {myUserId && (
            <>
              {!showQr ? (
                <Button onClick={() => setShowQr(true)}>QRコードを表示</Button>
              ) : (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <p style={{ margin: "0 0 10px", color: "#334155" }}>
                    このQRを相手に読み取ってもらうと、プロフィール詳細ページが開きます
                  </p>
                  <img
                    src={qrImageUrl}
                    alt="プロフィール交換QR"
                    width={220}
                    height={220}
                    style={{ display: "block", margin: "0 auto", borderRadius: 12, background: "#fff" }}
                  />
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>
                    {qrPayload}
                  </p>
                  <div style={{ marginTop: 12, display: "flex", gap: 12, justifyContent: "center" }}>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(qrPayload);
                          window.alert("QRデータをコピーしました");
                        } catch {
                          window.alert("コピーに失敗しました");
                        }
                      }}
                    >
                      URLをコピー
                    </Button>
                    <Button variant="ghost" onClick={() => setShowQr(false)}>
                      閉じる
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="pf-actions">
          <Link to="/edit_profile">
            <button className="pf-btn pf-btn-ghost">編集</button>
          </Link>
          <Link to="/">
            <button className="pf-btn pf-btn-ghost">戻る</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
