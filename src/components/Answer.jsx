import { Link } from "react-router-dom";
import "./Answer.css"
const Answer = () => {
    const judge = true;
    const answer = "絵を描くこと"
    const user_answer = "散歩"

    return (
        <div className="answer-container">
            <h1>あなたの回答は{judge ? "正解" : "不正解"}です</h1>
            <div> 正解は：{answer}</div>
            <div>あなたの回答は{user_answer}です</div>
            <Link to="/question">
                <button>次の問題へ</button>
            </Link>

        </div>
        
        
    )
  
}

export default Answer