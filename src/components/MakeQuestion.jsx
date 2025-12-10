import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { faculty, grade } from "./Array";
import { useState } from "react";
const MakeQuestion = () => {
  const pre_answers = JSON.parse(localStorage.getItem("answers"));
  const detail_department = JSON.parse(
    localStorage.getItem("addtionalInformation")
  );
  const [answer1, setAnswer1] = useState(pre_answers?.username || "");
  const [furigana, setFurigana] = useState(pre_answers?.furigana || "");
  const [answer2, setAnswer2] = useState(pre_answers?.department || "");
  const [answer3, setAnswer3] = useState(pre_answers?.grade || "");
  const [answer4, setAnswer4] = useState(pre_answers?.hobby || "");
  const [answer5, setAnswer5] = useState(pre_answers?.artist || "");
  const [addtionalInformation, setAddtionalInformation] =
    useState(detail_department);
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    const answers = {
      username: answer1,
      furigana: furigana || "",
      department: answer2,
      grade: answer3,
      hobby: answer4,
      artist: answer5,
    };
    console.log(answers);
    if (answer1 && answer2 !== "" && answer3 !== "" && answer4 && answer5) {
      window.localStorage.setItem("answers", JSON.stringify(answers));
      navigate("/");
    } else {
      window.alert("入力してください");
    }
    window.localStorage.setItem(
      "addtionalInformation",
      JSON.stringify(addtionalInformation)
    );
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
          フリガナ
          <input
            type="text"
            value={furigana}
            onChange={(e) => setFurigana(e.target.value)}
            placeholder="フリガナ"
            autoFocus
          ></input>
        </label>
        <label>学部</label>
        <label>
          <div>
            <select
              onChange={(e) => setAnswer2(e.target.value)}
              value={answer2}
            >
              <option value="">選択してください</option>
              {faculty.slice(1).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <div>具体的な学部</div>
          <input
            type="text"
            value={addtionalInformation}
            onChange={(e) => setAddtionalInformation(e.target.value)}
            placeholder=""
            autoFocus
          ></input>
        </label>
        <label>学年</label>
        <label>
          <div>
            <select
              onChange={(e) => setAnswer3(e.target.value)}
              value={answer3}
            >
              <option value="">選択してください</option>
              {grade.slice(1).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
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
