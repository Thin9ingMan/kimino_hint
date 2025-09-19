import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Question.css";
const Question = () => {
  const location = useLocation();
  const [count, setCount] = useState(location.state?.count || 0);
  const [timeLeft, setTimeLeft] = useState(10); //制限時間
  const score = location.state?.score || 0;
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
      answer: "RADWIMPS",
    },
  ];
  useEffect(() => {
    if (timeLeft === 0) {
      timeUp();
      return;
    }

    const timeId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(timeId);
  }, [timeLeft]);

  useEffect(() => {
    setTimeLeft(10);
  }, [count]);

  const answer = (selectedAnswer) => {
    const currentQuestion = questions[count];
    const judge = selectedAnswer === currentQuestion.answer;
    navigate("/answer", {
      state: {
        judge: judge, // 正誤判定 (true/false)
        count: count + 1, // 現在の問題番号
        score: score, //現在のスコア
        selected: selectedAnswer, // ユーザーが選んだ回答
        correctAnswer: currentQuestion.answer, // 正解の答え
      },
    });
  };

  const timeUp = () => {
    const currentQuestion = questions[count];
    navigate("/answer", {
      state: {
        judge: false, // 正誤判定 (true/false)
        count: count + 1, // 現在の問題番号
        score: score, //現在のスコア
        selected: "時間切れ", // ユーザーが選んだ回答
        correctAnswer: currentQuestion.answer, // 正解の答え
      },
    });
  };
  if (count >= questions.length) {
    return (
      <Link to="/profile">
        <button>プロフィールへ進む</button>
      </Link>
    );
  }
  return (
    <>
      <h1>{questions[count].question}</h1>
      <h2>残り時間: {timeLeft}秒</h2>
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
