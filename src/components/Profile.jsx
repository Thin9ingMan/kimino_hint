import { Link } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const answers = JSON.parse(localStorage.getItem("answers"));
  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール</h1>

        <dl className="pf-table">
          <div className="pf-row">
            <dt className="pf-label">名前</dt>
            <dd className="pf-value">{answers[0]}</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">学部</dt>
            <dd className="pf-value">{answers[1]}</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">学年</dt>
            <dd className="pf-value">{answers[2]}</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">趣味</dt>
            <dd className="pf-value">{answers[3]}</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">好きなアーティスト</dt>
            <dd className="pf-value">{answers[5]}</dd>
          </div>
        </dl>

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
