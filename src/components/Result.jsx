import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Result.css";
import { useEffect } from "react";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const score = Number(location.state?.score || 0);
  const count = Number(location.state?.count || 0);
  const targetUserId = location.state?.targetUserId;
  const targetProfile = location.state?.targetProfile;
  const percent = count > 0 ? Math.round((score / count) * 100) : 0;

  useEffect(() => {
    // If this was a quiz about another user, save the result
    if (targetUserId && targetProfile) {
      const quizResults = JSON.parse(localStorage.getItem("quizResults") || "{}");
      quizResults[targetUserId] = {
        score,
        count,
        percent,
        userName: targetProfile.displayName,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("quizResults", JSON.stringify(quizResults));
    }
  }, [targetUserId, targetProfile, score, count, percent]);

  const handleNextAction = () => {
    if (targetUserId) {
      // If this was a quiz about another user, go back to profile list
      navigate("/profile_history");
    } else {
      // Otherwise, go to profile page (original behavior)
      navigate("/profile");
    }
  };

  return (
    <div className="res-wrap">
      <div className="res-card">
        <h1 className="res-title">結果</h1>
        
        {targetProfile && (
          <div style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
            {targetProfile.displayName}さんのクイズ
          </div>
        )}

        <div className="res-kpi">
          {/* 右側に置きたい場合はこの2つのブロックの順番を逆にしてください */}
          {/* 円グラフ（中央に「正解率」→「33%」） */}
          <div
            className="res-progress"
            style={{ "--p": percent + "%" }}
            aria-label={`正解率 ${percent}%`}
          >
            <div className="res-progress-inner">
              <div className="res-caption">正解率</div>
              <div className="res-percent">{percent}%</div>
            </div>
          </div>

          {/* 問題数・正解数カード */}
          <div className="res-stats">
            <div className="res-stat">
              <span className="res-stat-label">点数</span>
              <span className="res-stat-value">
                {score}/{count}
              </span>
            </div>
          </div>
        </div>

        {/* ↓この外側のキャプションは不要なので削除しました */}
        {/* <div className="res-caption">正解率</div> */}

        <div className="res-actions">
          <button className="res-btn" onClick={handleNextAction}>
            {targetUserId ? "プロフィール一覧へ" : "プロフィールへ進む"}
          </button>
          <Link to="/">
            <button className="res-btn res-btn-ghost">ホームへ戻る</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Result;
