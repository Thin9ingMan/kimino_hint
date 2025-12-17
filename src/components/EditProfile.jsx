import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apis } from "../api/client";
import { faculty, grade } from "./Array";
import styles from "./EditProfile.module.css";
import { ProfileCard } from "./ui/ProfileCard";
import LabeledField from "./ui/LabeledField";
import Button from "./ui/Button";

const defaultProfile = {
  name: "",
  furigana: "",
  grade: "",
  faculty: "",
  hobby: "",
  favoriteArtist: "",
  facultyDetail: "",
};

const FORM_FIELDS = [
  { id: "name", label: "名前", placeholder: "名前", required: true, autoFocus: true },
  { id: "furigana", label: "フリガナ", placeholder: "フリガナ" },
  { id: "faculty", label: "学部", type: "select", options: faculty },
  { id: "facultyDetail", label: "具体的な学部" },
  { id: "grade", label: "学年", type: "select", options: grade },
  { id: "hobby", label: "趣味", placeholder: "趣味" },
  { id: "favoriteArtist", label: "好きなアーティスト", placeholder: "好きなアーティスト" },
];

const REQUIRED_FIELDS = [
  { key: "name", label: "名前" },
  { key: "faculty", label: "学部" },
  { key: "grade", label: "学年" },
  { key: "hobby", label: "趣味" },
  { key: "favoriteArtist", label: "好きなアーティスト" },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const formFields = useMemo(() => FORM_FIELDS, []);

  const setField = useCallback(
    (key) => (value) => setProfile((prev) => ({ ...prev, [key]: value })),
    []
  );

  const validateProfile = useCallback(() => {
    const emptyFields = REQUIRED_FIELDS
      .filter(({ key }) => !profile[key]?.trim())
      .map(({ label }) => label);

    return emptyFields.length === 0
      ? { valid: true }
      : { valid: false, message: `${emptyFields.join("、")}を入力してください` };
  }, [profile]);

  const renderFormField = useCallback(
    (field) => (
      <LabeledField
        key={field.id}
        id={field.id}
        name={field.id}
        label={field.label}
        type={field.type}
        value={profile[field.id]}
        onValueChange={setField(field.id)}
        placeholder={field.placeholder}
        required={field.required}
        autoFocus={field.autoFocus}
        options={field.options}
      />
    ),
    [profile, setField]
  );

  const fetchProfile = useCallback(async () => {
    setInitialLoading(true);
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
        facultyDetail: "",
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        setProfile(defaultProfile);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validation = validateProfile();
    if (!validation.valid) {
      window.alert(validation.message);
      return;
    }

    setSaving(true);
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
      setSaving(false);
    }
  };

  const renderLoading = () => (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>プロフィール編集</h1>
        <p>{saving ? "保存中..." : "読み込み中..."}</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>プロフィール編集</h1>
        <p className={styles.error}>{error}</p>
        <Button onClick={fetchProfile}>再試行</Button>
      </div>
    </div>
  );

  if (initialLoading || saving) return renderLoading();
  if (error && error !== "プロフィールが存在しません") return renderError();

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>プロフィール編集</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {formFields.map(renderFormField)}

          <div className={styles.actions}>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/my_profile")}
              disabled={saving}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;