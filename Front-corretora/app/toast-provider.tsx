'use client';

import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useState } from 'react';

export default function ToastProvider() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Captura código de indicação (?ref=) e persiste para uso no registro
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const ref = sp.get('ref') || sp.get('referral') || sp.get('code');
      if (ref) localStorage.setItem('referralCode', ref);
    } catch {}
  }, []);
  if (!mounted) return null;
  return (
    <ToastContainer
      position="top-right"
      hideProgressBar
      newestOnTop
      closeOnClick
      autoClose={4000}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      transition={Slide}
      toastStyle={{
        background: '#18181b',
        color: '#fff',
        border: '1px solid #23232b',
        borderRadius: '12px'
      }}
      bodyStyle={{
        fontSize: '0.9rem'
      }}
    />
  );
}


