import { Link, useLocation } from "react-router-dom";
import "./Result.css";

const Result = () => {
  const location = useLocation();
  const score = Number(location.state?.score || 0);
  const count = Number(location.state?.count || 0);
  const percent = count > 0 ? Math.round((score / count) * 100) : 0;

  return (
    <div className="res-wrap">
      <div className="res-card">
        <h1 className="res-title">結果</h1>

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
          <Link to="/profile">
            <button className="res-btn">プロフィールへ進む</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Result;
