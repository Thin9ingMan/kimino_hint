import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apis } from "../api/client";
import { faculty, grade } from "./Array";
import styles from "./EditProfile.module.css";

const defaultProfile = {
  name: "",
  furigana: "",
  grade: "",
  faculty: "",
  hobby: "",
  favoriteArtist: "",
  // 詳細学部（UI上のみ）
  facultyDetail: "",
};


const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const response = await apis.profiles().getMyProfile();
      const profileData = response.profileData || {};
      const apiProfile = {
        name: profileData.displayName || "",
        furigana: profileData.furigana || "",
        grade: profileData.grade || "",
        faculty: profileData.faculty || "",
        hobby: profileData.hobby || "",
        favoriteArtist: profileData.favoriteArtist || "",
      };
      setProfile({
        name: apiProfile.name,
        furigana: apiProfile.furigana,
        grade: apiProfile.grade,
        faculty: apiProfile.faculty,
        hobby: apiProfile.hobby,
        favoriteArtist: apiProfile.favoriteArtist,
        facultyDetail: "",
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        // プロフィール未作成：空のフォームから開始
        setProfile({ ...defaultProfile });
      } else {
        console.error("Failed to fetch profile:", err);
        setError("プロフィールの取得に失敗しました");
      }
    } finally {
      setInitialLoading(false);
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
    setError(null);

    // 学生さんのバリデーション（必須: 名前/学部/学年/趣味/好きなアーティスト）
    const requiredOk =
      profile.name &&
      profile.faculty &&
      profile.grade &&
      profile.hobby &&
      profile.favoriteArtist;

    if (!requiredOk) {
      window.alert("入力してください");
      return;
    }

    setSaving(true);
    try {
      // ローカルドラフト保存は廃止（APIのみを使用）

      // API更新
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
      setSaving(false);
    }
  };

  if (initialLoading || saving) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>プロフィール編集</h1>
          <p>{saving ? "保存中..." : "読み込み中..."}</p>
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
              placeholder="名前"
              autoFocus
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
              placeholder="フリガナ"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="faculty">学部</label>
            <select
              id="faculty"
              name="faculty"
              value={profile.faculty}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="">選択してください</option>
              {faculty.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="facultyDetail">具体的な学部</label>
            <input
              type="text"
              id="facultyDetail"
              name="facultyDetail"
              value={profile.facultyDetail}
              onChange={handleChange}
              className={styles.formInput}
              placeholder=""
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="grade">学年</label>
            <select
              id="grade"
              name="grade"
              value={profile.grade}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="">選択してください</option>
              {grade.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
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
              placeholder="趣味"
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
              placeholder="好きなアーティスト"
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.btn} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/my_profile")}
              disabled={saving}
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