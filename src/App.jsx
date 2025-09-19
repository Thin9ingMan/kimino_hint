import "./App.css";
import Index from "./Index";
import Detail from "./components/Detail";
import Question from "./components/question";
import Profile from "./components/Profile";
import Answer from "./components/Answer";
import Result from "./components/Result";
import Room from "./components/room";
import Profile_history from "./components/Profile_history";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/question" element={<Question />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/answer" element={<Answer />} />
        <Route path="/result" element={<Result />} />
        <Route path="/room" element={<Room />} />
        <Route path="/profile_history" element={<Profile_history />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
