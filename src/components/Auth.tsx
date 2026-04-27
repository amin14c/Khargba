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

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

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
      setError(err.message);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await confirmationResult.confirm(code);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 pt-10">
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md p-8 space-y-6 bg-[#8B5E3C] rounded-2xl text-white shadow-lg">
        <div>
          <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-center">Join the Circle</h3>
          <p className="text-[10px] text-center opacity-60 leading-relaxed max-w-[250px] mx-auto uppercase tracking-wider">
            Online matchmaking is only available for registered players.
          </p>
        </div>
        
        <div className="flex justify-center space-x-2 border-b border-white/10 pb-4">
          <button 
            className={`px-4 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors ${isEmail ? 'bg-[#FDFBF7] text-[#8B5E3C]' : 'text-white/60 hover:bg-white/10'}`}
            onClick={() => setIsEmail(true)}
          >
            {t('email')}
          </button>
          <button 
            className={`px-4 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors ${!isEmail ? 'bg-[#FDFBF7] text-[#8B5E3C]' : 'text-white/60 hover:bg-white/10'}`}
            onClick={() => setIsEmail(false)}
          >
            {t('phone')}
          </button>
        </div>

        {error && <div className="p-3 text-[10px] uppercase tracking-wider font-bold text-red-200 bg-red-900/30 rounded-lg">{error}</div>}

        {isEmail ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1 opacity-80 text-white">{t('email')}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@mail.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1 opacity-80 text-white">{t('password')}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#FDFBF7] text-[#8B5E3C] font-bold py-3 mt-4 rounded-lg text-[11px] uppercase tracking-wider hover:bg-white transition-colors"
            >
              {isLogin ? t('login') : t('register')}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[10px] uppercase tracking-wider text-white/70 hover:text-white underline underline-offset-2">
                {isLogin ? t('register') : t('login')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {!confirmationResult ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1 opacity-80 text-white">{t('phone')} (e.g. +1234567890)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+1234567890"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-[#FDFBF7] text-[#8B5E3C] font-bold py-3 mt-4 rounded-lg text-[11px] uppercase tracking-wider hover:bg-white transition-colors"
                >
                  {t('send_code')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1 opacity-80 text-white">{t('verification_code')}</label>
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-[#FDFBF7] text-[#8B5E3C] font-bold py-3 mt-4 rounded-lg text-[11px] uppercase tracking-wider hover:bg-white transition-colors"
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
