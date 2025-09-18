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

  const nextquestion = () => {
    navigate("/question", {
      state: {
        count: count, // 現在の問題番号
      },
    });
  };
  console.log(count);
  return (
    <div className="answer-container">
      <h1>あなたの回答は{judge ? "正解" : "不正解"}です</h1>
      <div> 正解は：{answer}</div>
      <div>あなたの回答は{user_answer}です</div>
      <button onClick={nextquestion}>次の問題へ</button>
    </div>
  );
};

export default Answer;
