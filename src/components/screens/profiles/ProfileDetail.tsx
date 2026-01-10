import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apis } from "@/shared/api";
import { ProfileCard } from "../../ui/ProfileCard";
import Button from "../../ui/Button";
import common from "../../ui/common.module.css";
import styles from "./ProfileDetail.module.css";

type UiProfile = {
  name?: string;
  furigana?: string;
  grade?: string;
  faculty?: string;
  hobby?: string;
  favoriteArtist?: string;
};

function mapProfileDataToUiProfile(profileData?: Record<string, unknown>): UiProfile {
  const pd = profileData ?? {};
  return {
    name: (pd.displayName as string) ?? "",
    furigana: (pd.furigana as string) ?? "",
    grade: (pd.grade as string) ?? "",
    faculty: (pd.faculty as string) ?? "",
    hobby: (pd.hobby as string) ?? "",
    favoriteArtist: (pd.favoriteArtist as string) ?? "",
  };
}

export default function ProfileDetail() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = params.userId ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.userId]);

  const [profile, setProfile] = useState<UiProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [exchanging, setExchanging] = useState(false);
  const [exchangeDone, setExchangeDone] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setError("userId が不正です");
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    setError(null);

    try {
      const res = await apis.profiles.getUserProfile({ userId });
      setProfile(mapProfileDataToUiProfile(res?.profileData as unknown as Record<string, unknown>));
    } catch (e: any) {
      console.error("Failed to fetch user profile:", e);
      const status = e?.status ?? e?.response?.status;

      if (status === 404) setError("プロフィールが見つかりませんでした");
      else if (status === 401) setError("認証が必要です（トークンが無効か期限切れの可能性）");
      else setError("プロフィールの取得に失敗しました");
    } finally {
      setInitialLoading(false);
    }
  }, [userId]);

  const handleExchange = useCallback(async () => {
    if (!userId) return;

    setExchanging(true);
    setExchangeDone(false);
    setExchangeError(null);

    try {
      // POST /api/users/{userId}/friendship (operationId: receiveFriendship)
      // generated client requires { userId, receiveFriendshipRequest }
      await apis.friendships.receiveFriendship({
        userId,
        receiveFriendshipRequest: {
          meta: {
            source: "qr",
            at: new Date().toISOString(),
          },
        },
      });

      setExchangeDone(true);
    } catch (e: any) {
      console.error("Failed to create friendship:", e);
      const status = e?.status ?? e?.response?.status;
      if (status === 409) setExchangeError("すでに交換済みです");
      else if (status === 404) setExchangeError("ユーザーが見つかりませんでした");
      else if (status === 401) setExchangeError("認証が必要です（トークンが無効か期限切れの可能性）");
      else setExchangeError("交換に失敗しました");
    } finally {
      setExchanging(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const renderLoading = () => (
    <div className={common.fullPageWrap}>
      <div className={common.card}>
        <h1 className={common.title}>プロフィール詳細</h1>
        <p>読み込み中...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className={common.fullPageWrap}>
      <div className={common.card}>
        <h1 className={common.title}>プロフィール詳細</h1>
        <p className={common.error}>{error}</p>
        <div className={styles.footerActions}>
          <Button onClick={fetchProfile}>再試行</Button>
          <Link to="/profiles" className={styles.linkReset}>
            <Button variant="ghost">一覧へ戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  if (initialLoading) return renderLoading();
  if (error) return renderError();

  return (
    <div className={common.fullPageWrap}>
      <div className={common.card}>
        <h1 className={common.title}>プロフィール詳細</h1>

        <ProfileCard profile={profile ?? {}} />

        <div className={styles.footerActions}>
          <Button onClick={handleExchange} disabled={exchanging || exchangeDone}>
            {exchangeDone ? "交換済み" : exchanging ? "交換中..." : "この人と交換する"}
          </Button>

          <Link to="/profiles" className={styles.linkReset}>
            <Button variant="ghost">一覧へ戻る</Button>
          </Link>
        </div>

        {exchangeError && <p className={common.error}>{exchangeError}</p>}
        {exchangeDone && !exchangeError && (
          <p style={{ margin: "10px 0 0", color: "#334155", fontWeight: 600 }}>
            交換しました。プロフィール一覧に追加されます。
          </p>
        )}
      </div>
    </div>
  );
}