import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Auth from './components/Auth';
import GameLobby from './components/Game';
import './i18n';
import { LogOut } from 'lucide-react';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [langSelected, setLangSelected] = useState<boolean>(() => !!localStorage.getItem('langSelected'));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              email: u.email || u.phoneNumber || '',
              displayName: u.email ? u.email.split('@')[0] : (u.phoneNumber || 'Player'),
              createdAt: serverTimestamp()
            });
          }
        } catch (e: any) {
          if (e.message && e.message.toLowerCase().includes('offline')) {
            console.warn("Client is offline. Profile check/creation skipped.");
          } else {
            console.error("Error creating user profile", e);
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleInitialLangSelect = (lng: string) => {
    changeLanguage(lng);
    localStorage.setItem('langSelected', 'true');
    setLangSelected(true);
  };

  if (!langSelected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="luxury-panel p-10 max-w-sm w-full text-center space-y-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl font-display mb-6 mx-auto border-2 border-[#D4AF37] luxury-text-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]">ⴷ</div>
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] luxury-text-gold font-display">Select Language</h2>
          <div className="flex flex-col gap-4">
             <button onClick={() => handleInitialLangSelect('ar')} className="luxury-btn w-full py-3 rounded text-sm font-bold opacity-90 hover:opacity-100">العربية</button>
             <button onClick={() => handleInitialLangSelect('tzm')} className="luxury-btn w-full py-3 rounded text-sm font-bold opacity-90 hover:opacity-100">ⵜⴰⵎⴰⵣⵉⵖⵜ</button>
             <button onClick={() => handleInitialLangSelect('fr')} className="luxury-btn w-full py-3 rounded text-sm font-bold opacity-90 hover:opacity-100">Français</button>
             <button onClick={() => handleInitialLangSelect('en')} className="luxury-btn w-full py-3 rounded text-sm font-bold opacity-90 hover:opacity-100">English</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-display luxury-text-gold tracking-[0.2em] uppercase">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col font-serif">
      {/* Header Section */}
      <header className="flex justify-between items-center px-6 py-6 border-b border-[rgba(212,175,55,0.15)] bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-3xl font-display border border-[#D4AF37] luxury-text-gold shadow-sm">ⴷ</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase font-display luxury-text-gold">ⴷⴰⵎⴰ ⵏ ⵜⵉⵏⵉ / داما النواة</h1>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-display text-[#D4AF37] opacity-60 mt-1">Desert Strategy • 7x7 Tactical Board</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium">
          <select 
            value={i18n.language} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-[#D4AF37] outline-none cursor-pointer hidden md:block uppercase tracking-widest text-xs font-display"
          >
            <option value="en" className="bg-[#12100E]">English</option>
            <option value="fr" className="bg-[#12100E]">Français</option>
            <option value="ar" className="bg-[#12100E]">العربية</option>
            <option value="tzm" className="bg-[#12100E]">ⵜⴰⵎⴰⵣⵉⵖⵜ</option>
          </select>
          {user && (
            <button 
              onClick={() => signOut(auth)}
              className="luxury-btn px-4 py-2 rounded flex items-center gap-2 text-[10px]"
              title={t('logout')}
            >
              <LogOut size={16} />
              <span className="hidden md:inline uppercase font-bold tracking-widest">Logout</span>
            </button>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col md:flex-row px-4 md:px-10 py-8 gap-10 w-full max-w-7xl mx-auto">
        {!user ? (
          <Auth onLogin={() => {}} />
        ) : (
          <GameLobby />
        )}
      </main>

      {/* Bottom Branding (Footer) */}
      <footer className="h-16 flex items-center justify-center px-10 text-[#D4AF37] opacity-40 text-[10px] font-display tracking-[0.3em] uppercase mt-auto border-t border-[rgba(212,175,55,0.1)] bg-black/20">
        Sahara Dama Online © 2026 • Rocks & Seeds Edition
      </footer>
    </div>
  );
}
