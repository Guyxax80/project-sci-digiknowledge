import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './input.css'
import './output.css'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3e73b7' },
    secondary: { main: '#e36a39' },
    background: { default: '#f4f7fb' },
    text: { primary: '#111827' }
  },
  typography: {
    fontFamily: 'Inter, Noto Sans Thai, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif'
  },
  shape: { borderRadius: 12 }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
