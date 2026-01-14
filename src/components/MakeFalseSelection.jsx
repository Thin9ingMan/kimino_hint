import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apis } from "@/shared/api";
import { falseNames, falseHobbies, falseArtists } from "./Array";
import "./MakeFalseSelection.css";
import { useAuth } from "@/shared/auth";
const MakeFalseSelection = () => {
  const [falseName1, setFalseName1] = useState("");
  const [falseName2, setFalseName2] = useState("");
  const [falseName3, setFalseName3] = useState("");
  const [falseHobby1, setFalseHobby1] = useState("");
  const [falseHobby2, setFalseHobby2] = useState("");
  const [falseHobby3, setFalseHobby3] = useState("");
  const [falseArtist1, setFalseArtist1] = useState("");
  const [falseArtist2, setFalseArtist2] = useState("");
  const [falseArtist3, setFalseArtist3] = useState("");
  const [verySimilarFalseName1, setVerySimilarFalseName1] = useState("");
  const [verySimilarFalseName2, setVerySimilarFalseName2] = useState("");
  const [verySimilarFalseName3, setVerySimilarFalseName3] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [answers, setAnswers] = useState({
    name: "",
    hobby: "",
    favoriteArtist: "",
  });
  const navigate = useNavigate();
  const { state } = useAuth();
  const fetchProfile = useCallback(async () => {
    try {
      const response = await apis.profiles.getMyProfile();
      const profileData = response.profileData || {};

      setAnswers({
        name: profileData.displayName || "",
        hobby: profileData.hobby || "",
        favoriteArtist: profileData.favoriteArtist || "",
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        setAnswers({ name: "", hobby: "", favoriteArtist: "" });
      } else {
        console.error("Failed to fetch profile:", err);
      }
    }
  }, []);

    const fetchFakeNames = useCallback(async () => {
    if (!answers.name) return;
    try{
      const response = await apis.llm.generateFakeNames({fakeNamesRequest: {
        inputName: answers.name,
        variance: "互いにまったく似ていない名前",
      }});
      const quiz4Response = await apis.llm.generateFakeNames({fakeNamesRequest: {
        inputName: answers.name,
        variance: "ほぼ違いがない名前",
      }});
      const receivedNames = Array.from(response.output || []);
      const quiz4ReceivedNames = Array.from(quiz4Response.output || []);
      if (receivedNames.length > 0) setFalseName1(receivedNames[0] || "");
      if (receivedNames.length > 1) setFalseName2(receivedNames[1] || "");
      if (receivedNames.length > 2) setFalseName3(receivedNames[2] || "");
      if (quiz4ReceivedNames.length > 0) setVerySimilarFalseName1(quiz4ReceivedNames[0] || "");
      if (quiz4ReceivedNames.length > 1) setVerySimilarFalseName2(quiz4ReceivedNames[1] || "");
      if (quiz4ReceivedNames.length > 2) setVerySimilarFalseName3(quiz4ReceivedNames[2] || "");
      
    } catch (err) {
      if (err?.response?.status === 404) {
        console.err(err);
      } else {
        console.error("Failed to fetch profile:", err);
      }
    } finally {
      setInitialLoading(false);
    }
  },[answers.name])

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

    useEffect(() => {
    if (answers.name) {
        fetchFakeNames();
    }
  }, [answers.name, fetchFakeNames]);


  
  const handleSubmit = async(e) => {
    e.preventDefault();
    const falseAnswers = {
      username: [falseName1, falseName2, falseName3],
      hobby: [falseHobby1, falseHobby2, falseHobby3],
      artist: [falseArtist1, falseArtist2, falseArtist3],
      verySimilarUsername: [verySimilarFalseName1, verySimilarFalseName2, verySimilarFalseName3],
    };
    console.log(falseAnswers);
    // 直で渡す
    window.localStorage.setItem("falseAnswers", JSON.stringify(falseAnswers));
    // 直で渡す
    // navigate("/question");
    navigate("/question", {
      state: {
        falseAnswers: falseAnswers,
      },
    });
  };

  const randomMakeSelection = (arr, elementToExclude) => {
    const filteredArray = arr.filter((item) => item !== elementToExclude);
    const shuffledArray = [...filteredArray];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    const result = shuffledArray.slice(0, 3);
    return result;
  };
  const randomFalseName = randomMakeSelection(falseNames, answers.name);
  const randomFalseHobbies = randomMakeSelection(falseHobbies, answers.hobby);
  const randomFalseArtists = randomMakeSelection(
    falseArtists,
    answers.favoriteArtist
  );
  const onClickHandler = () => {
    falseName1 ? setFalseName1(falseName1) : setFalseName1(randomFalseName[0]);
    falseName2 ? setFalseName2(falseName2) : setFalseName2(randomFalseName[1]);
    falseName3 ? setFalseName3(falseName3) : setFalseName3(randomFalseName[2]);
    falseHobby1
      ? setFalseHobby1(falseHobby1)
      : setFalseHobby1(randomFalseHobbies[0]);
    falseHobby2
      ? setFalseHobby2(falseHobby2)
      : setFalseHobby2(randomFalseHobbies[1]);
    falseHobby3
      ? setFalseHobby3(falseHobby3)
      : setFalseHobby3(randomFalseHobbies[2]);
    falseArtist1
      ? setFalseArtist1(falseArtist1)
      : setFalseArtist1(randomFalseArtists[0]);
    falseArtist2
      ? setFalseArtist2(falseArtist2)
      : setFalseArtist2(randomFalseArtists[1]);
    falseArtist3
      ? setFalseArtist3(falseArtist3)
      : setFalseArtist3(randomFalseArtists[2]);
  };
  return (
    <>
      <h1>間違えの選択肢を作ろう</h1>
      <form onSubmit={handleSubmit}>
        <label>名前</label>
        <div id="answer">正解:{answers.name}</div>
          <input
            type="text"
            value={falseName1}
            onChange={(e) => setFalseName1(e.target.value)}
            placeholder="名前1"
            autoFocus
          />
          
      
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
        <div id="answer">正解:{answers.hobby}</div>
        <input
          type="text"
          value={falseHobby1}
          onChange={(e) => setFalseHobby1(e.target.value)}
          placeholder="趣味"
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
        <div id="answer">正解:{answers.favoriteArtist}</div>
        <input
          type="text"
          value={falseArtist1}
          onChange={(e) => setFalseArtist1(e.target.value)}
          placeholder="好きなアーティスト"
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
        <button type="submit" onClick={() => handleSubmit()}>
          次へ
        </button>
        <button type="button" onClick={() => onClickHandler()}>
          ランダムで作成
        </button>
      </form>
      <Link to="/room">
        <button>戻る</button>
      </Link>
    </>
  );
};

export default MakeFalseSelection;
