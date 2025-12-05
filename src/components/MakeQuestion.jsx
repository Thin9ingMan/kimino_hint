import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useState } from "react";
const MakeQuestion = () => {
  const pre_answers = JSON.parse(localStorage.getItem("answers"));
  const detail_department = JSON.parse(
    localStorage.getItem("addtionalInformation")
  );
  const [answer1, setAnswer1] = useState(pre_answers?.username);
  const [furigana, setFurigana] = useState(pre_answers?.furigana);
  const [answer2, setAnswer2] = useState(pre_answers?.department);
  const [answer3, setAnswer3] = useState(pre_answers?.grade);
  const [answer4, setAnswer4] = useState(pre_answers?.hobby);
  const [answer5, setAnswer5] = useState(pre_answers?.artist);
  const [addtionalInformation, setAddtionalInformation] =
    useState(detail_department);
  const navigate = useNavigate();
  const faculty = [
    "選択してください",
    "法学部",
    "経済学部",
    "経営学部",
    "商学部",
    "社会学部",
    "国際学部",
    "文学部",
    "外国語学部",
    "教育学部",
    "心理学部",
    "家政学部",
    "芸術学部",
    "体育学部",
    "理学部",
    "工学部",
    "情報学部",
    "農学部",
    "医学部",
    "歯学部",
    "薬学部",
    "看護学部",
  ];
  const grade = [
    "選択してください",
    "学部1年",
    "学部2年",
    "学部3年",
    "学部4年",
    "修士1年",
    "修士2年",
  ];
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
              {faculty.map((name) => (
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
              {grade.map((name) => (
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
