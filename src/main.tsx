import React from 'react';import{createRoot}from'react-dom/client';import{registerSW}from'virtual:pwa-register';import App from './App';import'./styles.css';import{AppProvider}from'./hooks/useApp';
registerSW({immediate:true});createRoot(document.getElementById('root')!).render(<React.StrictMode><AppProvider><App/></AppProvider></React.StrictMode>);
