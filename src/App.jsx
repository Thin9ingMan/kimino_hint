import { useGuestAuth } from "./hooks/useGuestAuth";
import "./App.css";
import Index from "./Index";
import Question from "./components/question";
import Profile from "./components/Profile";
import Answer from "./components/Answer";
import Result from "./components/Result";
import Room from "./components/Room";
import Profile_history from "./components/Profile_history";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MakeQuestion from "./components/MakeQuestion";
import MyProfile from "./components/MyProfile";
import EditProfile from "./components/EditProfile";
import ReadQRCode from "./components/ReadQRCode";



function App() {
  const { ready, error, retry } = useGuestAuth();

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: "30vh" }}>
        <div style={{ fontSize: 22, marginBottom: 12 }}>認証に失敗しました</div>
        <div style={{ color: "#64748b", marginBottom: 16 }}>{String(error.message || error)}</div>
        <button onClick={retry}>再試行</button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ textAlign: "center", marginTop: "30vh", fontSize: 24 }}>
        認証中...
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/question" element={<Question />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/answer" element={<Answer />} />
        <Route path="/result" element={<Result />} />
        <Route path="/room" element={<Room />} />
        <Route path="/profile_history" element={<Profile_history />} />
        <Route path="/make_question" element={<MakeQuestion />} />
        <Route path="/my_profile" element={<MyProfile />} />
        <Route path="/edit_profile" element={<EditProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
