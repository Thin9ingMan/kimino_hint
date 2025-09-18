import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Question.css";
const Question = () => {
  const location = useLocation();
  const [count, setCount] = useState(location.state?.count || 0);
  const navigate = useNavigate();
  const questions = [
    {
      question: "名前は何でしょう？",
      select: ["深海真", "森林誠", "洞窟誠", "天空誠"],
      answer: "深海真",
    },
    {
      question: "学部は何でしょう？",
      select: ["情報科学", "情報メディア創生", "知識情報・図書館", "芸術専門"],
      answer: "芸術専門",
    },
    {
      question: "学年は何でしょう？",
      select: ["1", "2", "3", "4"],
      answer: "3",
    },
    {
      question: "趣味は何でしょう？",
      select: ["絵を描くこと", "サッカー", "将棋", "ゲーム"],
      answer: "絵を描くこと",
    },
    {
      question: "名前は何でしょう？",
      select: ["深海誠", "深海慎", "深海真人", "深海真"],
      answer: "深海真",
    },
    {
      question: "好きなアーティストは誰でしょう？",
      select: ["ヨルシカ", "RADWIMPS", "YOASOBI", "吉幾三"],
      answer: "吉幾三",
    },
  ];
  console.log("確認", count);
  const answer = (selectedAnswer) => {
    const currentQuestion = questions[count];
    const judge = selectedAnswer === currentQuestion.answer;
    navigate("/answer", {
      state: {
        judge: judge, // 正誤判定 (true/false)
        count: count + 1, // 現在の問題番号
        selected: selectedAnswer, // ユーザーが選んだ回答
        correctAnswer: currentQuestion.answer, // 正解の答え
      },
    });
  };
  if (count >= questions.length) {
    return (
      <div>
        <h1>クイズ終了</h1>
        <p>お疲れ様でした！</p>
      </div>
    );
  }
  return (
    <>
      <h1>{questions[count].question}</h1>
      <div className="question-container">
        <button onClick={() => answer(questions[count].select[0])}>
          {questions[count].select[0]}
        </button>
        <button onClick={() => answer(questions[count].select[1])}>
          {questions[count].select[1]}
        </button>
        <button onClick={() => answer(questions[count].select[2])}>
          {questions[count].select[2]}
        </button>
        <button onClick={() => answer(questions[count].select[3])}>
          {questions[count].select[3]}
        </button>
      </div>
    </>
  );
};

export default Question;
