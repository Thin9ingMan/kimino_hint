import { Link } from "react-router-dom";
import "./Profile.css";
import { ProfileCard } from "./ui/ProfileCard";
import { useState, useEffect } from "react";
import { apis } from "../api/client";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apis.profiles().getMyProfileRaw();
        if (response.raw.status === 404) {
          setProfile(null);
        } else {
          const profileData = await response.value();
          setProfile({
            ...profileData.profileData,
            name: profileData.profileData.displayName,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("プロフィールの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
          <button onClick={() => window.location.reload()}>再試行</button>
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
