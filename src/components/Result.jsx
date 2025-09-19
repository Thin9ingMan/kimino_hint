import { Link, useLocation } from "react-router-dom";
const Result = () => {
    const location = useLocation();
    const score = location.state?.score || 0;
    const count = location.state?.count || 0;
  return (
    <div>
        <div id="result">あなたの正解率は{Math.round((score/count)*100)}%です</div>
        <Link to="/profile">
            <button>プロフィールへ進む</button>
        </Link>


    </div>
    
  )
}

export default Result