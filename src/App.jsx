import "./App.css";
import Index from "./Index";
import Detail from "./components/Detail";
import Question from "./components/question";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Answer from "./components/Answer";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/question" element={<Question />} />
        <Route path="/answer" element={<Answer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
