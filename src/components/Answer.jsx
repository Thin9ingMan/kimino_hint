// import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apis } from "@/shared/api"; // APIクライアント
import "./Answer.css";

const Answer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const judge = location.state?.judge;
  const answer = location.state?.correctAnswer;
  const user_answer = location.state?.selected;
  const count = location.state?.count;
  const currentScore = location.state?.score || 0;
 const [additionalInformation, setAdditionalInformation] = useState(null);
  const [loading, setLoading] = useState(true); // データがロード中かどうか

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
 // APIからデータを取得
  useEffect(() => {
    const fetchAdditionalInfo = async () => {
      try {
        const response = await apis.profiles().getMyProfile();
        const profileData = response.profileData || {}; // プロフィールデータを取得
        setAdditionalInformation(profileData.facultyDetail || ""); // APIから取得した学部情報を表示
      } catch (err) {
        console.error("データ取得エラー:", err);
        setAdditionalInformation("データ取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchAdditionalInfo();
  }, []); // 初回マウント時に1回だけ実行

  //正誤によるクラス分け
  const containerClass = `answer-container ${judge ? "correct" : "incorrect"}`;

// ローディング中に表示するメッセージ
  if (loading) {
    return <p>データを読み込み中...</p>;
  }

  return (
    <>
      <div className={containerClass}>
        <h1>あなたの回答は{judge ? "正解" : "不正解"}です</h1>
        <div>正解は：{answer}</div>
        {count == 2 && <div>{additionalInformation}</div>}
        <div>あなたの回答は {user_answer} です</div>
        <button onClick={nextquestion}>次の問題へ</button>
      </div>
    </>
  );
};

export default Answer;
