import { Link } from "react-router-dom";
import "./Profile.css";
import { ProfileCard } from "./ui/ProfileCard";

const MyProfile = () => {
  const answers = JSON.parse(localStorage.getItem("answers"));
  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <h1 className="pf-title">プロフィール</h1>
        <ProfileCard
          profile={{
            name: answers.username,
            faculty: answers.department,
            hobby: answers.hobby,
            favoriteArtist: answers.artist,
          }}
        />

        <div className="pf-actions">
          <Link to="/make_question">
            <button className="pf-btn pf-btn-ghost">編集</button>
          </Link>
          <Link to="/">
            <button className="pf-btn pf-btn-ghost">戻る</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
