import { Link } from "react-router-dom";

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
    </>
  );
};

export default Index;
