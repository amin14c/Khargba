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
        } catch (e) {
          console.error("Error creating user profile", e);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#8B5E3C] font-serif">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3728] font-serif flex flex-col">
      {/* Header Section */}
      <header className="flex justify-between items-center px-6 py-6 border-b border-[#E8E2D9]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8B5E3C] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm">ⴷ</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">ⴷⴰⵎⴰ ⵏ ⵜⵉⵏⵉ / داما النواة</h1>
            <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-60">Desert Strategy • 7x7 Tactical Board</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium">
          <select 
            value={i18n.language} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-[#8B5E3C] font-bold outline-none cursor-pointer hidden md:block uppercase tracking-wider text-xs"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="tzm">ⵜⴰⵎⴰⵣⵉⵖⵜ</option>
          </select>
          {user && (
            <button 
              onClick={() => signOut(auth)}
              className="px-3 py-1 bg-[#E8E2D9] text-[#4A3728] rounded-md hover:bg-[#D9D1C5] transition flex items-center gap-2"
              title={t('logout')}
            >
              <LogOut size={16} />
              <span className="hidden md:inline uppercase text-[10px] font-bold">{t('logout')}</span>
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
      <footer className="h-12 bg-[#4A3728] flex items-center px-10 text-white/40 text-[10px] tracking-[0.2em] uppercase mt-auto">
        Sahara Dama Online © 2026 • Rocks & Seeds Edition
      </footer>
    </div>
  );
}
