import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { apis } from "../api/client";
import { ProfileCard } from "./ui/ProfileCard";
import "./Profile.css";

const UserProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(location.state?.profile || null);
  const [loading, setLoading] = useState(!location.state?.profile);
  const [error, setError] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [creatingFriendship, setCreatingFriendship] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const user = await apis.users().getUserById({ id: parseInt(userId) });
      const profileData = await apis.profiles().getLatestProfile({ userId: parseInt(userId) });
      
      setProfile({
        userId: user.id,
        displayName: user.displayName,
        profileData: profileData.profileData || {},
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("プロフィールの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const checkFriendshipStatus = useCallback(async () => {
    try {
      const friendships = await apis.friendships().listReceivedFriendships();
      const friendship = friendships.find(f => 
        f.fromUserId === parseInt(userId) || f.toUserId === parseInt(userId)
      );
      setFriendshipStatus(friendship?.status || null);
    } catch (err) {
      console.error("Failed to check friendship status:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
    checkFriendshipStatus();
  }, [fetchProfile, checkFriendshipStatus, profile]);

  const handleCreateFriendship = async () => {
    setCreatingFriendship(true);
    try {
      await apis.friendships().createFriendship({
        friendshipCreateRequest: {
          toUserId: parseInt(userId),
        }
      });
      setFriendshipStatus("ACCEPTED"); // Assuming auto-accept for mutual friendships
      alert("友達になりました！");
    } catch (err) {
      console.error("Failed to create friendship:", err);
      alert("友達申請に失敗しました");
    } finally {
      setCreatingFriendship(false);
    }
  };

  const handleStartQuiz = () => {
    // Navigate to quiz page with this user's profile
    navigate("/question", { 
      state: { 
        targetUserId: parseInt(userId),
        targetProfile: profile 
      } 
    });
  };

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
          <p>プロフィールが見つかりません</p>
          <Link to="/profile_history">
            <button className="pf-btn">一覧に戻る</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール</h1>
        <ProfileCard
          profile={{
            name: profile.displayName,
            furigana: profile.profileData.furigana || "-",
            grade: profile.profileData.grade || "-",
            faculty: profile.profileData.faculty || "-",
            hobby: profile.profileData.hobby || "-",
            favoriteArtist: profile.profileData.favoriteArtist || "-",
          }}
        />

        {friendshipStatus === "ACCEPTED" && (
          <div style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "10px",
            textAlign: "center",
          }}>
            このユーザーとは友達です
          </div>
        )}

        <div className="pf-actions">
          {friendshipStatus !== "ACCEPTED" && (
            <button 
              className="pf-btn"
              onClick={handleCreateFriendship}
              disabled={creatingFriendship}
            >
              {creatingFriendship ? "申請中..." : "友達になる"}
            </button>
          )}
          <button 
            className="pf-btn"
            onClick={handleStartQuiz}
          >
            クイズを解く
          </button>
          <Link to="/profile_history">
            <button className="pf-btn pf-btn-ghost">一覧に戻る</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
