import { Link } from "react-router-dom";
import "./Profile_history.css";

const Profile_history = () => {
  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール一覧</h1>
        <div className="container">
            {/* 1つ目のプロフィール */}
            <div className="profile">
                <dl className="pf-table">
                    <div className="pf-row">
                        <dt className="pf-label">名前</dt>
                        <dd className="pf-value">深海　真</dd>
                    </div>
                    <div className="pf-row">
                        <dt className="pf-label">学部</dt>
                        <dd className="pf-value">芸術専門学群</dd>
                    </div>
                    <div className="pf-row">
                        <dt className="pf-label">趣味</dt>
                        <dd className="pf-value">絵を描くこと</dd>
                    </div>
                    <div className="pf-row">
                        <dt className="pf-label">好きなアーティスト</dt>
                        <dd className="pf-value">RADWIMPS</dd>
                    </div>
                </dl>
            </div>
            {/* 2つ目のプロフィール */}
            <div className="profile">
                <dl className="pf-table">
                    <div className="pf-row">
                        <dt className="pf-label">名前</dt>
                        <dd className="pf-value">神木　隆之介</dd>
                    </div>
                    <div className="pf-row">
                        <dt className="pf-label">学部</dt>
                        <dd className="pf-value">理工学群</dd>
                    </div>
                    <div className="pf-row">
                        <dt className="pf-label">趣味</dt>
                        <dd className="pf-value">写真撮影</dd>
                    </div>
                    <div className="pf-row">
                        <dt className="pf-label">好きなアーティスト</dt>
                        <dd className="pf-value">YOASOBI</dd>
                    </div>
                </dl>
            </div>


            
        </div>

        



        
        

        <div className="pf-actions">
          <Link to="/">
            <button className="pf-btn pf-btn-ghost">戻る</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Profile_history