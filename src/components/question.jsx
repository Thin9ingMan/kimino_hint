import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Question.css";
const Question = () => {
  const location = useLocation();
  const count = location.state?.count || 0;
  const score = location.state?.score || 0;
  const navigate = useNavigate();
  const answers = JSON.parse(localStorage.getItem("answers")); //ユーザが保存した回答
  const questions = [
    {
      question: "名前は何でしょう？",
      select: [answers[0], "森林誠", "洞窟誠", "天空誠"],
      answer: answers[0],
    },
    {
      question: "学部は何でしょう？",
      select: ["情報科学", "情報メディア創生", "知識情報・図書館", answers[1]],
      answer: answers[1],
    },
    {
      question: "学年は何でしょう？",
      select: ["1", "2", answers[2], "4"],
      answer: answers[2],
    },
    {
      question: "趣味は何でしょう？",
      select: [answers[3], "サッカー", "将棋", "ゲーム"],
      answer: answers[3],
    },
    {
      question: "名前は何でしょう？",
      select: ["深海誠", "深海慎", "深海真人", answers[4]],
      answer: answers[4],
    },
    {
      question: "好きなアーティストは誰でしょう？",
      select: ["ヨルシカ", answers[5], "YOASOBI", "吉幾三"],
      answer: answers[5],
    },
  ];

  const randomSelect = (arr) => {
    //選択肢の順番を変更
    const shuffled = arr
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    return shuffled;
  };

  const checkAnswer = (selectedAnswer) => {
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

  useEffect(() => {
    if (count >= questions.length) {
      navigate("/result", {
        state: {
          score: score,
          count: questions.length,
        },
      });
    }
  }, [count, questions.length, score, navigate]);
  // 全ての問題が終わる前のレンダリングを制御
  if (count >= questions.length) {
    // 結果ページに遷移するまでの間、何も表示しないかローディング画面などを表示
    return <div>結果を計算中...</div>;
  }

  // 現在の問題の選択肢
  const nowQuestionSelect = randomSelect(questions[count].select);

  return (
    <>
      <h1>{questions[count].question}</h1>
      <div className="question-container">
        <button onClick={() => checkAnswer(nowQuestionSelect[0])}>
          {nowQuestionSelect[0]}
        </button>
        <button onClick={() => checkAnswer(nowQuestionSelect[1])}>
          {nowQuestionSelect[1]}
        </button>
        <button onClick={() => checkAnswer(nowQuestionSelect[2])}>
          {nowQuestionSelect[2]}
        </button>
        <button onClick={() => checkAnswer(nowQuestionSelect[3])}>
          {nowQuestionSelect[3]}
        </button>
      </div>
    </>
  );
};

export default Question;
