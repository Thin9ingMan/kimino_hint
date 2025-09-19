// import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

import "./Answer.css";
const Answer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const judge = location.state?.judge;
  const answer = location.state?.correctAnswer;
  const user_answer = location.state?.selected;
  const count = location.state?.count;
  const currentScore = location.state?.score || 0;

  // 正解ならスコアを1加算、不正解ならそのまま
  const newScore = judge ? currentScore + 1 : currentScore;


  const nextquestion = () => {
    navigate("/question", {
      state: {
        count: count, // 現在の問題番号
        score: newScore, // 更新したスコアを次のページに渡す
      },
    });
  };
  console.log(count);
  return (
    <>
      <div className="score">現在のスコア:{newScore}</div>
      <div className="answer-container">
        <h1>あなたの回答は{judge ? "正解" : "不正解"}です</h1>
        <div>正解は：{answer}</div>
        <div>あなたの回答は {user_answer} です</div>
        <button onClick={nextquestion}>次の問題へ</button>
      </div>
    </>
  );
};

export default Answer;
