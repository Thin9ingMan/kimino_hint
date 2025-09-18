import { Link } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール</h1>

        <dl className="pf-table">
          <div className="pf-row">
            <dt className="pf-label">名前</dt>
            <dd className="pf-value">山田 太郎</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">学部</dt>
            <dd className="pf-value">情報学群 知識情報・図書館学類</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">趣味</dt>
            <dd className="pf-value">バドミントン / 写真</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">好きな音楽</dt>
            <dd className="pf-value">J-POP, Piano</dd>
          </div>
          <div className="pf-row">
            <dt className="pf-label">好きなアーティスト</dt>
            <dd className="pf-value">YOASOBI, 米津玄師</dd>
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
