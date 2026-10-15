import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import './index.css';
import { App } from './App';

const akar = document.getElementById('akar');
if (!akar) throw new Error('Elemen #akar tidak ditemukan');

createRoot(akar).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
