import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import './styles/app.css';
import './styles/drive.css';
import './styles/onboarding.css';
import './styles/car.css';
import './styles/trips.css';
import './styles/profile.css';
import './styles/eyewatch.css';

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);

if(import.meta.env.PROD && 'serviceWorker' in navigator){void navigator.serviceWorker.register('/sw.js').catch(()=>{});}
