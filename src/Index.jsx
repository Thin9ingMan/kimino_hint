import { Link } from "react-router-dom";
import "./start_page.css";

const Index = () => {
  return (
    <>
      <h1>キミのヒント</h1>
      <Link to="/detail">
        <button>詳細ページへ</button>
      </Link>
      <Link to="/question">
        <button>クイズへ</button>
      </Link>
      <Link to="/profile">
        <button>プロフィールへ</button>
      </Link>
    </>
  );
};

export default Index;
