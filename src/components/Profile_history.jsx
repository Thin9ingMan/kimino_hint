import { Link } from "react-router-dom";
import "./Profile_history.css";
import { ProfileCard } from "./ui/ProfileCard";

const Profile_history = () => {
    return (
        <div className="pf-wrap">
            <div className="pf-card">
                <h1 className="pf-title">プロフィール一覧</h1>
                <div className="container">
                    
                
                    <ProfileCard
                        profile={{
                            name: '深海　真',
                            faculty: '芸術専門学群',
                            hobby: '絵を描くこと',
                            favoriteArtist: 'RADWIMPS',
                        }}
                    />

                    <ProfileCard
                        profile={{
                            name: '青木　花',
                            faculty: '情報理工学群',
                            hobby: '写真',
                            favoriteArtist: '椎名林檎',
                        }}
                    />

                    <ProfileCard
                        profile={{
                            name: '佐藤　太郎',
                            faculty: '経済学部',
                            hobby: 'サッカー',
                            favoriteArtist: '米津玄師',
                        }}
                    />
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