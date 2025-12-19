import { Link } from "react-router-dom";
import "./Profile.css";
import { ProfileCard } from "./ui/ProfileCard";
import { useState, useEffect } from "react";
import { apis } from "../api/client";

const Profile = () => {
  // Stateの定義
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// API取得処理
useEffect(() => {
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apis.profiles().getMyProfile();
      setProfile(response.profileData || {});
    } catch (err) {
      console.error(err);
      setError("プロフィールの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };
  fetchProfile();
}, []);

// ローディング・エラー表示の追加
if (loading) return <div className="pf-wrap">読み込み中...</div>;
if (error) return <div className="pf-wrap">{error}</div>;
  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール</h1>

        <ProfileCard
          profile={{
            name: profile?.displayName || "",      // APIキー: displayName
            furigana: profile?.furigana || "",
            grade: profile?.grade || "",
            faculty: profile?.faculty || "",       // APIキー: faculty
            hobby: profile?.hobby || "",
            favoriteArtist: profile?.favoriteArtist || "", // APIキー: favoriteArtist
          }}
        />

        <div className="pf-actions">
          <Link to="/">
            <button className="pf-btn pf-btn-ghost">戻る</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
