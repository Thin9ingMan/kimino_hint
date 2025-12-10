import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { falseNames, falseHobbies, falseArtists } from './Array';

const MakeFalseSelection = () => {
    const [ falseName1, setFalseName1] = useState('');
    const [ falseName2, setFalseName2] = useState('');
    const [ falseName3, setFalseName3] = useState('');
    const [ falseHobby1, setFalseHobby1] = useState('');
    const [ falseHobby2, setFalseHobby2] = useState('');
    const [ falseHobby3, setFalseHobby3] = useState('');
    const [ falseArtist1, setFalseArtist1] = useState('');
    const [ falseArtist2, setFalseArtist2] = useState('');
    const [ falseArtist3, setFalseArtist3] = useState('');
    const navigate = useNavigate();
    const answers = JSON.parse(localStorage.getItem("answers"));
    const falseAnswers = JSON.parse(localStorage.getItem("falseAnswers"));
    const handleSubmit = (e) => {
    e.preventDefault();
    const falseAnswers = {
      username: [falseName1, falseName2, falseName3],
      hobby: [falseHobby1, falseHobby2, falseHobby3],
      artist: [falseArtist1, falseArtist2, falseArtist3],
    };
    console.log(falseAnswers);
    window.localStorage.setItem("falseAnswers", JSON.stringify(falseAnswers));
    navigate("/question");
  };
  //const falseNames = ["田中陽介", "鈴木信二", "宮久保健太", "佐藤花", "石川凛", "清水葵","田中健太郎","高橋翔太", "渡辺大輔", "山本蓮", "中村拓也", "小林誠","加藤勇気", "吉田蒼", "山田達也", "井上奏太", "木村拓実","松本潤一", "林修平", "斎藤亮太","伊藤美咲", "佐々木結衣", "山口さくら", "森陽菜", "阿部奈々","菅原美優", "橋本澪", "大野楓", "内田杏奈", "長谷川愛","近藤真央", "藤田莉子", "後藤真由","西園寺玲奈", "伊集院翔", "五郎丸歩", "早乙女馨", "神宮寺蓮"];
  //const falseHobbies = ["サッカー", "将棋", "ゲーム", "読書", "映画鑑賞", "アニメ鑑賞", "マンガ", "音楽鑑賞","料理", "お菓子作り", "プログラミング", "手芸", "旅行", "キャンプ", "釣り", "登山", "散歩","カフェ巡り", "ドライブ", "御朱印集め", "サウナ","野球", "テニス", "バスケ", "バレーボール", "卓球","水泳", "ランニング", "筋トレ", "ヨガ", "ダンス","ピアノ", "ギター", "カラオケ", "イラスト", "写真（カメラ）","英会話", "DIY", "麻雀"];
  //const falseArtists = ["ヨルシカ", "YOASOBI", "吉幾三", "Vaundy", "Ado", "King Gnu", "Mrs. GREEN APPLE", "Official髭男dism", "優里", "藤井風", "tuki.","BUMP OF CHICKEN", "RADWIMPS", "back number", "ONE OK ROCK", "SEKAI NO OWARI", "緑黄色社会","米津玄師", "星野源", "あいみょん", "菅田将暉", "宇多田ヒカル", "椎名林檎","Snow Man", "乃木坂46", "BTS", "TWICE", "NewJeans","サザンオールスターズ", "Mr.Children", "スピッツ", "B'z", "松任谷由実", "マツケン（松平健）"];
  const randomMakeSelection = (arr, elementToExclude) => {
    const filteredArray = arr.filter(item => item !== elementToExclude);
    const shuffledArray = [...filteredArray]; 
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    const result = shuffledArray.slice(0, 3);
    return result;
  }
  const randomFalseName = randomMakeSelection(falseNames, answers.username);
  const randomFalseHobbies = randomMakeSelection(falseHobbies, answers.hobby);
  const randomFalseArtists = randomMakeSelection(falseArtists, answers.artist);
  const onClickHandler = () => {
    setFalseName1(randomFalseName[0]);
    setFalseName2(randomFalseName[1]);
    setFalseName3(randomFalseName[2]);
    setFalseHobby1(randomFalseHobbies[0]);
    setFalseHobby2(randomFalseHobbies[1]);
    setFalseHobby3(randomFalseHobbies[2]);
    setFalseArtist1(randomFalseArtists[0]);
    setFalseArtist2(randomFalseArtists[1]);
    setFalseArtist3(randomFalseArtists[2]);
  }
  return (
    <>
    <h1>間違えの選択肢を作ろう</h1>
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
        <button type="submit"
          onClick = {() => handleSubmit()}>次へ</button>
      <button
        type = "button"
        onClick ={() => onClickHandler()}>
          ランダムで作成
        </button>
    </form>
    <Link to="/room">
        <button>戻る</button>
    </Link>
    </>
    
  )
}

export default MakeFalseSelection