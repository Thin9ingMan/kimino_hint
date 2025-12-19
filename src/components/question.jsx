import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { faculty, grade } from "./Array";
import "./Question.css";

const Question = () => {
  const location = useLocation();
  const count = location.state?.count || 0;
  const score = location.state?.score || 0;
  const targetUserId = location.state?.targetUserId;
  const targetProfile = location.state?.targetProfile;
  const navigate = useNavigate();
  
  // If taking a quiz about another user, use their profile data
  // Otherwise, use the local storage data (for backward compatibility)
  let answers;
  let falseAnswers;
  
  if (targetProfile) {
    // Quiz about another user
    answers = {
      username: targetProfile.displayName,
      furigana: targetProfile.profileData.furigana || "",
      department: targetProfile.profileData.faculty || "",
      grade: targetProfile.profileData.grade || "",
      hobby: targetProfile.profileData.hobby || "",
      artist: targetProfile.profileData.favoriteArtist || "",
    };
    falseAnswers = null; // We'll use defaults for false answers
  } else {
    // Quiz about self (backward compatibility)
    answers = JSON.parse(localStorage.getItem("answers"));
    falseAnswers = JSON.parse(localStorage.getItem("falseAnswers"));
  }

  function getRandomThreeExcludingElement(originalArray, elementToExclude) {
    const filteredArray = originalArray.filter(item => item !== elementToExclude);
    const shuffledArray = [...filteredArray]; 
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    const result = shuffledArray.slice(0, 3);
    
    return result;
  }
  
  const falseFaculty = getRandomThreeExcludingElement(faculty, answers.department);
  const falseGrade = getRandomThreeExcludingElement(grade, answers.grade);
  
  const questions = [
    {
      question: "名前は何でしょう？",
      select: [answers["username"], falseAnswers?.username?.[0] || "田中陽介", falseAnswers?.username?.[1] || "鈴木信二", falseAnswers?.username?.[2] || "宮久保健太"],
      answer: answers["username"],
    },
    {
      question: "学部は何でしょう？",
      select: [
        falseFaculty[0],
        falseFaculty[1],
        falseFaculty[2],
        answers["department"],
      ],
      answer: answers["department"],
    },
    {
      question: "学年は何でしょう？",
      select: [falseGrade[0], falseGrade[1] , answers["grade"], falseGrade[2]],
      answer: answers["grade"],
    },
    {
      question: "趣味は何でしょう？",
      select: [answers["hobby"], falseAnswers?.hobby?.[0] || "サッカー", falseAnswers?.hobby?.[1] || "将棋", falseAnswers?.hobby?.[2] || "ゲーム"],
      answer: answers["hobby"],
    },
    {
      question: "名前は何でしょう？",
      select: ["佐藤花", "石川凛", "清水葵", answers["username"]],
      answer: answers["username"],
    },
    {
      question: "好きなアーティストは誰でしょう？",
      select: [falseAnswers?.artist?.[0] || "ヨルシカ", answers["artist"] , falseAnswers?.artist?.[1] || "YOASOBI", falseAnswers?.artist?.[2] || "吉幾三"],
      answer: answers["artist"],
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
        targetUserId, // Pass along for multi-question quiz
        targetProfile, // Pass along for multi-question quiz
      },
    });
  };

  useEffect(() => {
    if (count >= questions.length) {
      navigate("/result", {
        state: {
          score: score,
          count: questions.length,
          targetUserId,
          targetProfile,
        },
      });
    }
  }, [count, questions.length, score, navigate, targetUserId, targetProfile]);
  
  // 全ての問題が終わる前のレンダリングを制御
  if (count >= questions.length) {
    // 結果ページに遷移するまでの間、何も表示しないかローディング画面などを表示
    return <div>結果を計算中...</div>;
  }

  // 現在の問題の選択肢
  const nowQuestionSelect = randomSelect(questions[count].select);

  return (
    <>
      {targetProfile && (
        <div style={{ textAlign: "center", marginBottom: "10px", color: "#666" }}>
          {targetProfile.displayName}さんについてのクイズ
        </div>
      )}
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
