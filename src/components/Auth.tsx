import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const { t } = useTranslation();
  const [isEmail, setIsEmail] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('network-request-failed')) {
        setError("Network connection lost. Please check your internet and try again.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      // Reset recaptcha if failed
      if (window.recaptchaVerifier) {
        (window.recaptchaVerifier as any).clear();
        window.recaptchaVerifier = undefined;
      }
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await confirmationResult.confirm(code);
      onLogin();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('network-request-failed')) {
        setError("Network connection lost. Please check your internet and try again.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 py-10">
      <div id="recaptcha-container"></div>
      <div className="luxury-panel w-full max-w-md p-10 space-y-8">
        <div>
          <h3 className="text-xl font-display font-bold mb-3 uppercase tracking-[0.2em] text-center luxury-text-gold">Join the Circle</h3>
          <p className="text-[10px] text-center text-[#E6D5B8] opacity-60 leading-relaxed max-w-[250px] mx-auto uppercase tracking-wider font-sans">
            Wait for your opponent or enter the sands as a registered player.
          </p>
        </div>
        
        <div className="flex justify-center space-x-3 border-b border-[rgba(212,175,55,0.15)] pb-5">
          <button 
            className={`px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-bold rounded transition-colors ${isEmail ? 'luxury-btn text-[#D4AF37]' : 'text-[#E6D5B8] opacity-50 hover:opacity-100'}`}
            onClick={() => setIsEmail(true)}
          >
            {t('email')}
          </button>
          <button 
            className={`px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-bold rounded transition-colors ${!isEmail ? 'luxury-btn text-[#D4AF37]' : 'text-[#E6D5B8] opacity-50 hover:opacity-100'}`}
            onClick={() => setIsEmail(false)}
          >
            {t('phone')}
          </button>
        </div>

        {error && <div className="p-3 text-[10px] uppercase tracking-wider font-bold text-red-200 bg-red-900/30 border border-red-900/50 rounded">{error}</div>}

        {isEmail ? (
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold mb-2 opacity-80 text-[#D4AF37] tracking-wider font-display">{t('email')}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@mail.com"
                className="w-full bg-[#12100E] border border-[#4a3a2a] rounded px-4 py-3 text-sm text-[#E6D5B8] placeholder:text-[#E6D5B8]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold mb-2 opacity-80 text-[#D4AF37] tracking-wider font-display">{t('password')}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#12100E] border border-[#4a3a2a] rounded px-4 py-3 text-sm text-[#E6D5B8] placeholder:text-[#E6D5B8]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
            <button 
              type="submit" 
              className="luxury-btn-primary w-full py-3 mt-6 rounded text-[11px]"
            >
              {isLogin ? t('login') : t('register')}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[10px] uppercase tracking-wider text-[#E6D5B8]/60 hover:text-[#D4AF37] transition-colors underline underline-offset-4">
                {isLogin ? t('register') : t('login')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {!confirmationResult ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-2 opacity-80 text-[#D4AF37] tracking-wider font-display">{t('phone')} (e.g. +123...)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+1234567890"
                    className="w-full bg-[#12100E] border border-[#4a3a2a] rounded px-4 py-3 text-sm text-[#E6D5B8] placeholder:text-[#E6D5B8]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <button 
                  type="submit" 
                  className="luxury-btn-primary w-full py-3 mt-4 rounded text-[11px]"
                >
                  {t('send_code')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-2 opacity-80 text-[#D4AF37] tracking-wider font-display">{t('verification_code')}</label>
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-[#12100E] border border-[#4a3a2a] rounded px-4 py-3 text-sm text-[#E6D5B8] placeholder:text-[#E6D5B8]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <button 
                  type="submit" 
                  className="luxury-btn-primary w-full py-3 mt-4 rounded text-[11px]"
                >
                  {t('verify_code')}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
