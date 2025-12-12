import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apis } from "../api/client";
import styles from "./EditProfile.module.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    furigana: "",
    grade: "",
    faculty: "",
    hobby: "",
    favoriteArtist: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apis.profiles().getMyProfile();
      const profileData = response.profileData || {};
      setProfile({
        name: profileData.displayName || "",
        furigana: profileData.furigana || "",
        grade: profileData.grade || "",
        faculty: profileData.faculty || "",
        hobby: profileData.hobby || "",
        favoriteArtist: profileData.favoriteArtist || "",
      });
    } catch (err) {
      if (err.response.status === 404) {
        setProfile({
          name: "",
          furigana: "",
          grade: "",
          faculty: "",
          hobby: "",
          favoriteArtist: "",
        });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apis.profiles().updateMyProfile({
        userProfileUpdateRequest: {
          profileData: {
            displayName: profile.name,
            furigana: profile.furigana,
            grade: profile.grade,
            faculty: profile.faculty,
            hobby: profile.hobby,
            favoriteArtist: profile.favoriteArtist,
          },
        },
      });
      navigate("/my_profile");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("プロフィールの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>プロフィール編集</h1>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && error !== "プロフィールが存在しません") {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>プロフィール編集</h1>
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={fetchProfile}>再試行</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>プロフィール編集</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">名前</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="furigana">フリガナ</label>
            <input
              type="text"
              id="furigana"
              name="furigana"
              value={profile.furigana}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="grade">学年</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={profile.grade}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="faculty">学部</label>
            <input
              type="text"
              id="faculty"
              name="faculty"
              value={profile.faculty}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="hobby">趣味</label>
            <input
              type="text"
              id="hobby"
              name="hobby"
              value={profile.hobby}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="favoriteArtist">好きなアーティスト</label>
            <input
              type="text"
              id="favoriteArtist"
              name="favoriteArtist"
              value={profile.favoriteArtist}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/my_profile")}
              disabled={loading}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;