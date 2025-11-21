import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";

const makeFalseSelection = () => {
    const [ falseName1, setFalseName1] = useState('')
    const [ falseName2, setFalseName2] = useState('')
    const [ falseName3, setFalseName3] = useState('')
    const [ falseHobby1, setFalseHobby1] = useState('')
    const [ falseHobby2, setFalseHobby2] = useState('')
    const [ falseHobby3, setFalseHobby3] = useState('')
    const [ falseArtist1, setFalseArtist1] = useState('')
    const [ falseArtist2, setFalseArtist2] = useState('')
    const [ falseArtist3, setFalseArtist3] = useState('')
    const navigate = useNavigate();
    const handleSubmit = (e) => {
    e.preventDefault();
    const falseAnswers = {
      username: [falseName1, falseName2, falseName3],
      hobby: [falseHobby1, falseHobby2, falseHobby3],
      artist: [falseArtist1, falseArtist2, falseArtist3],
    };
    console.log(falseAnswers);
    window.localStorage.setItem("falseAnswers", JSON.stringify(falseAnswers));
    navigate("/");
  };
  return (
    <>
    <form onSubmit={handleSubmit}>
        <label>名前</label>
        <input
         type="text"
        value={falseName1}
        onChange={(e) => setFalseName1(e.target.value)}
        placeholder="名前"
        autoFocus
        ></input>

        <input
         type="text"
        value={falseName2}
        onChange={(e) => setFalseName2(e.target.value)}
        autoFocus
        ></input>

         <input
         type="text"
        value={falseName3}
        onChange={(e) => setFalseName3(e.target.value)}
        autoFocus
        ></input>

        <label>趣味</label>
        <input
         type="text"
        value={falseHobby1}
        onChange={(e) => setFalseHobby1(e.target.value)}
        autoFocus
        ></input>

        <input
         type="text"
        value={falseHobby2}
        onChange={(e) => setFalseHobby2(e.target.value)}
        autoFocus
        ></input>

        <input
         type="text"
        value={falseHobby3}
        onChange={(e) => setFalseHobby3(e.target.value)}
        autoFocus
        ></input>

        <label>好きなアーティスト</label>
        <input
         type="text"
        value={falseArtist1}
        onChange={(e) => setFalseArtist1(e.target.value)}
        autoFocus
        ></input>

        <input
         type="text"
        value={falseArtist2}
        onChange={(e) => setFalseArtist2(e.target.value)}
        autoFocus
        ></input>

        <input
         type="text"
        value={falseArtist3}
        onChange={(e) => setFalseArtist3(e.target.value)}
        autoFocus
        ></input>
        <button type="submit">作成</button>
    </form>
    <Link to="/">
        <button>戻る</button>
    </Link>
    </>
    
  )
}

export default makeFalseSelection