import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter } from 'react-router-dom';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <HashRouter>
      <head>
        <meta name="description" content="Zach Upstone's personal website" />
        <meta name="keywords" content="Zach Upstone, Zachary Upstone, Zach, Upstone, Graduate, Porgrammer, Developer, Artist" />
        <meta name="author" content="Zach Upstone, Zachary Upstone" />
      </head> 

      <App />
    </HashRouter>
  </React.StrictMode>
);
