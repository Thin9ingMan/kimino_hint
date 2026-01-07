import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { theme } from './styles/theme';
import '@mantine/core/styles.css';

function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
