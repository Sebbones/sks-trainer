import { Box, createTheme, Group, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router';
import App from './App.tsx';
import AreaPage from './AreaPage.tsx';
import './index.css';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean },
  {}
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <p>Upsi, da ist was schief gelaufen</p>;
    }

    return this.props.children;
  }
}

const theme = createTheme({});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Group justify="center">
        <Box maw={400} w={'100%'}>
          <ErrorBoundary>
            <HashRouter basename="/">
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/:area" element={<AreaPage />}></Route>
              </Routes>
            </HashRouter>
          </ErrorBoundary>
        </Box>
      </Group>
    </MantineProvider>
  </StrictMode>
);
