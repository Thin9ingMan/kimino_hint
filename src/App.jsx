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

function App() {
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
