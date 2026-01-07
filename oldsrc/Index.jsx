import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./start_page.css";
import { apis } from "./api/client"; // APIクライアント

const Index = () => {
  const [canStartQuiz, setCanStartQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

   // APIからデータを取得
  useEffect(() => {
    const checkProfileExists = async () => {
      try {
        await apis.profiles().getMyProfile();
        setCanStartQuiz(true); // プロフィールあり
      } catch (err) {
        if (err?.response?.status === 404) {
          setCanStartQuiz(false); // プロフィールなし
        } else {
          console.error("データ取得エラー:", err);
        }
      } finally {
        setLoading(false);
      }
    };
checkProfileExists();
  }, []); // useEffect の依存配列を空にして初回マウント時にのみ実行

  const handleClickWithoutProfile = () => {
    alert("プロフィールを作成してからクイズに進んでください");
  };

  if (loading) {
    return <p>読み込み中...</p>;
  }


  return (
    <>
      <h1>キミのヒント</h1>
      {canStartQuiz ? (
        <Link to="/room">
          <button>クイズへ</button>
        </Link>
      ) : (
        <button onClick={handleClickWithoutProfile}>クイズへ</button>
      )}
      <Link to="/profiles">
        <button>プロフィール一覧へ</button>
      </Link>
      <Link to="/my_profile">
        <button>自分のプロフィール</button>
      </Link>
    </>
  );
};

export default Index;
