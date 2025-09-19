import { Link, useLocation } from "react-router-dom";
const Result = () => {
  const location = useLocation();
  const score = location.state?.score || 0;
  const count = location.state?.count || 0;
  console.log("スコアとカウント", score, count);
  return (
    <div>
      <div id="result">
        あなたの点数は{score} / {count * 3}点です
      </div>
      <Link to="/profile">
        <button>プロフィールへ進む</button>
      </Link>
    </div>
  );
};

export default Result;
