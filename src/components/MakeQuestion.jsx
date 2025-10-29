import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useState } from "react";
const MakeQuestion = () => {
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [answer3, setAnswer3] = useState("");
  const [answer4, setAnswer4] = useState("");
  const [answer5, setAnswer5] = useState("");
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    const answers = {
      username: answer1,
      department: answer2,
      grade: answer3,
      hobby: answer4,
      artist: answer5,
    };
    console.log(answers);
    if (answer1 && answer2 && answer3 && answer4 && answer5) {
      window.localStorage.setItem("answers", JSON.stringify(answers));
      navigate("/");
    } else {
      window.alert("入力してください");
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          名前
          <input
            type="text"
            value={answer1}
            onChange={(e) => setAnswer1(e.target.value)}
            placeholder="名前"
            autoFocus
          ></input>
        </label>
        <label>
          学部
          <input
            type="text"
            value={answer2}
            onChange={(e) => setAnswer2(e.target.value)}
            placeholder="学部"
            autoFocus
          ></input>
        </label>
        <label>
          学年
          <input
            type="text"
            value={answer3}
            onChange={(e) => setAnswer3(e.target.value)}
            placeholder="学年"
            autoFocus
          ></input>
        </label>
        <label>
          趣味
          <input
            type="text"
            value={answer4}
            onChange={(e) => setAnswer4(e.target.value)}
            placeholder="趣味"
            autoFocus
          ></input>
        </label>
        <label>
          好きなアーティスト
          <input
            type="text"
            value={answer5}
            onChange={(e) => setAnswer5(e.target.value)}
            placeholder="好きなアーティスト"
            autoFocus
          ></input>
        </label>
        <button type="submit">作成</button>
      </form>
      <Link to="/">
        <button>戻る</button>
      </Link>
    </>
  );
};

export default MakeQuestion;
