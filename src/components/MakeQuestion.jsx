import React from 'react'
import { useState } from 'react'
const MakeQuestion = () => {
    const [ answer1 , setAnswer1 ] = useState("")
    const [ answer2 , setAnswer2 ] = useState("")
    const [ answer3 , setAnswer3 ] = useState("")
    const [ answer4 , setAnswer4 ] = useState("")
    const [ answer5 , setAnswer5 ] = useState("")
    const [ answer6 , setAnswer6 ] = useState("")

    const handleSubmit = (e) => {
    e.preventDefault();
    window.localStorage.setItem("answer1",answer1);
    window.localStorage.setItem("answer2",answer2);
    window.localStorage.setItem("answer3",answer3);
    window.localStorage.setItem("answer4",answer4);
    window.localStorage.setItem("answer5",answer5);
    window.localStorage.setItem("answer6",answer6);
  };
  return (
    <form onSubmit={handleSubmit}>
        <label>
            名前
            <input 
            type="text"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder="名前"
              autoFocus>
            </input>
        </label> 
        <label>
            学部
            <input 
            type="text"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder="学部"
              autoFocus>
            </input>
        </label> 
        <label>
            学年
            <input 
            type="text"
              value={answer3}
              onChange={(e) => setAnswer3(e.target.value)}
              placeholder="学年"
              autoFocus>
            </input>
        </label> 
        <label>
            趣味
            <input 
            type="text"
              value={answer4}
              onChange={(e) => setAnswer4(e.target.value)}
              placeholder="趣味"
              autoFocus>
            </input>
        </label> 
        <label>
            名前
            <input 
            type="text"
              value={answer5}
              onChange={(e) => setAnswer5(e.target.value)}
              placeholder="名前"
              autoFocus>
            </input>
        </label> 
        <label>
            好きなアーティスト
            <input 
            type="text"
              value={answer6}
              onChange={(e) => setAnswer6(e.target.value)}
              placeholder="好きなアーティスト"
              autoFocus>
            </input>
        </label> 
       <button type="submit">作成</button>
        
    </form>
    
  )
}

export default MakeQuestion