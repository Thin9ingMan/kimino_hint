import { Link, useLocation } from "react-router-dom";
import "./Profile_history.css";
import { ProfileCard } from "./ui/ProfileCard";
import { useState, useEffect, useCallback } from "react";
import { apis } from "../api/client";

const Profile_history = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendships, setFriendships] = useState([]);
  const location = useLocation();
  const eventId = location.state?.eventId;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all users
      const users = await apis.users().listUsers();
      
      // Fetch profiles for each user
      const profilePromises = users.map(async (user) => {
        try {
          const profile = await apis.profiles().getLatestProfile({ userId: user.id });
          return {
            userId: user.id,
            displayName: user.displayName,
            profileData: profile.profileData || {},
          };
        } catch (err) {
          // If profile doesn't exist, return basic user info
          return {
            userId: user.id,
            displayName: user.displayName,
            profileData: {},
          };
        }
      });

      const fetchedProfiles = await Promise.all(profilePromises);
      
      // Filter out current user
      const currentUser = await apis.auth().getCurrentUser();
      const otherProfiles = fetchedProfiles.filter(p => p.userId !== currentUser.id);
      
      setProfiles(otherProfiles);
    } catch (err) {
      console.error("Failed to fetch profiles:", err);
      setError("プロフィールの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFriendships = useCallback(async () => {
    try {
      const received = await apis.friendships().listReceivedFriendships();
      setFriendships(received || []);
    } catch (err) {
      console.error("Failed to fetch friendships:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchFriendships();
  }, [fetchProfiles, fetchFriendships]);

  const isFriend = (userId) => {
    return friendships.some(f => 
      (f.fromUserId === userId || f.toUserId === userId) && f.status === 'ACCEPTED'
    );
  };

  if (loading) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h1 className="pf-title">プロフィール一覧</h1>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h1 className="pf-title">プロフィール一覧</h1>
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={fetchProfiles}>再試行</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール一覧</h1>
        {eventId && (
          <p style={{ marginBottom: "20px" }}>
            イベント参加中のユーザー
          </p>
        )}
        <div className="container">
          {profiles.length === 0 ? (
            <p>他のユーザーのプロフィールがまだありません</p>
          ) : (
            profiles.map((profile) => (
              <Link 
                key={profile.userId} 
                to={`/user_profile/${profile.userId}`}
                state={{ profile, eventId }}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ position: "relative" }}>
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
                  {isFriend(profile.userId) && (
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      fontSize: "12px",
                    }}>
                      友達
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="pf-actions">
          <Link to="/">
            <button className="pf-btn pf-btn-ghost">戻る</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile_history;