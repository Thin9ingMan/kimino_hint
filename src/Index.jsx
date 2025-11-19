import { Link } from "react-router-dom";
import "./start_page.css";

const Index = () => {
  const answers = localStorage.getItem("answers");
  const checkAnswer = () => {
    if (!answers) {
      alert("no");
    }
  };
  return (
    <>
      <h1>キミのヒント</h1>
      {answers ? (
        <Link to="/room">
          <button>クイズへ</button>
        </Link>
      ) : (
        <button onClick={checkAnswer}>クイズへ</button>
      )}
      <Link to="/profile_history">
        <button>プロフィール一覧へ</button>
      </Link>
      <Link to="/make_question">
        <button>プロフィール作成へ</button>
      </Link>
    </>
  );
};

export default Index;
