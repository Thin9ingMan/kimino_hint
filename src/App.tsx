import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./router";
import { AppProviders } from "./providers";

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
