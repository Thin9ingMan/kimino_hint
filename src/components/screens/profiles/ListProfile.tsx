import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apis } from "../../../api/client";
import { ProfileCard } from "../../ui/ProfileCard";
import Button from "../../ui/Button";
import common from "../../ui/common.module.css";
import styles from "./ListProfile.module.css";

/**
 * API:
 * - Friendships: GET /api/me/friendships/received (operationId: listReceivedFriendships)
 * - Profiles:   GET /api/users/{userId}/profile (operationId: getUserProfile)  ※詳細画面で使用
 */
type Friendship = {
  id: number;
  senderUserId: number;
  recipientUserId: number;
  senderProfile?: {
    userId: number;
    profileData?: Record<string, unknown>;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

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

export default function ListProfile() {
  const [items, setItems] = useState<Friendship[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profilesByUserId, setProfilesByUserId] = useState<Record<number, UiProfile>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const at = a.createdAt instanceof Date ? a.createdAt.getTime() : NaN;
      const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : NaN;
      if (!Number.isNaN(at) && !Number.isNaN(bt)) return bt - at;
      return (b.id ?? 0) - (a.id ?? 0);
    });
    return copy;
  }, [items]);

  const fetchFriendships = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const res = await apis.friendships().listReceivedFriendships();
      setItems((res ?? []) as unknown as Friendship[]);
      // senderProfile が null のことがあるため、プロフィールは別途 N+1 で埋める（useEffect側）
    } catch (e) {
      console.error("Failed to list received friendships:", e);
      setError("プロフィール一覧の取得に失敗しました");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  useEffect(() => {
    let cancelled = false;

    const fillProfilesNPlusOne = async () => {
      // friendship が無ければ何もしない
      if (!items.length) return;

      // senderUserId をユニーク化
      const userIds = Array.from(new Set(items.map((f) => f.senderUserId))).filter(
        (id) => typeof id === "number" && Number.isFinite(id)
      );

      // 既に取れてる分はスキップ
      const missing = userIds.filter((id) => profilesByUserId[id] == null);

      if (!missing.length) return;

      setProfilesLoading(true);
      try {
        const results = await Promise.allSettled(
          missing.map(async (userId) => {
            const res = await apis.profiles().getUserProfile({ userId });
            return { userId, profile: mapProfileDataToUiProfile(res?.profileData as any) };
          })
        );

        if (cancelled) return;

        setProfilesByUserId((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r.status === "fulfilled") {
              next[r.value.userId] = r.value.profile;
            }
          }
          return next;
        });
      } finally {
        if (!cancelled) setProfilesLoading(false);
      }
    };

    fillProfilesNPlusOne();

    return () => {
      cancelled = true;
    };
  }, [items, profilesByUserId]);

  const renderLoading = () => (
    <div className={common.fullPageWrap}>
      <div className={common.card}>
        <h1 className={common.title}>プロフィール一覧</h1>
        <p>読み込み中...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className={common.fullPageWrap}>
      <div className={common.card}>
        <h1 className={common.title}>プロフィール一覧</h1>
        <p className={common.error}>{error}</p>
      <div className={styles.footerActions}>
        <Button onClick={fetchFriendships}>再試行</Button>
        <Link to="/" className={styles.linkReset}>
          <Button variant="ghost">戻る</Button>
        </Link>
      </div>
      </div>
    </div>
  );

  if (initialLoading) return renderLoading();
  if (error) return renderError();

  if (!sorted.length) {
    return (
      <div className={common.fullPageWrap}>
        <div className={common.card}>
          <h1 className={common.title}>プロフィール一覧</h1>
          <p>まだプロフィール交換がありません。</p>
          <div className={styles.footerActions}>
            <Link to="/" className={styles.linkReset}>
              <Button variant="ghost">戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={common.fullPageWrap}>
      <div className={common.card}>
        <h1 className={common.title}>プロフィール一覧</h1>

        {profilesLoading && (
          <p style={{ margin: "0 0 10px", color: "#64748b" }}>プロフィール詳細を取得中...</p>
        )}

        <div className={styles.container}>
          {sorted.map((f) => {
            const userId = f.senderUserId;

            // senderProfile が常に null の不具合がある前提で、N+1 で埋めた値を優先する
            const uiProfile =
              profilesByUserId[userId] ?? mapProfileDataToUiProfile(f.senderProfile?.profileData);

            return (
              <div key={f.id} className={styles.item}>
                <ProfileCard profile={uiProfile} />
                <div className={styles.itemActions}>
                  <Link to={`/profiles/${userId}`} className={styles.linkReset}>
                    <Button>詳細</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.footerActions}>
          <Link to="/" className={styles.linkReset}>
            <Button variant="ghost">戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}