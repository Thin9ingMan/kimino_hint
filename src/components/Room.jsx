import { Link } from "react-router-dom";
import { useState } from "react";

const Room = () => {
  const [roomId, setRoomId] = useState("");

  return (
    <>
      <h1>ルームIDを入力してください</h1>
      <input
        type="text"
        id="roomId"
        name="roomId"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
        <Link to="/">
          <button>ホームへ戻る</button>
        </Link>
        
        <Link to={roomId ? "/make_false_selection" : "#"} style={{ pointerEvents: roomId ? "auto" : "none" }}>
          <button disabled={!roomId}>確認</button>
        </Link>
      </div>
    </>
  );
};

export default Room;
