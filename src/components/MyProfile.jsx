import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";
import { ProfileCard } from "./ui/ProfileCard";
import { useState, useEffect, useCallback } from "react";
import { apis } from "../api/client";

const MyProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstTime, setFirstTime] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 非Raw版は404等で例外を投げるため、catchで分岐して初回作成へ誘導する
      const response = await apis.profiles().getMyProfile();
      const profileData = response.profileData || {};
      setProfile({
        ...profileData,
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
          <button onClick={fetchProfile}>再試行</button>
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
