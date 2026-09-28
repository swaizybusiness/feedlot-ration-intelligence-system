import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleCalculator from './SimpleCalculator.jsx';
import './styles.css';
import './simpleStyles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SimpleCalculator />
  </React.StrictMode>,
);
