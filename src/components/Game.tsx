import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase/config';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { cn } from '../lib/utils';
import { LogOut, Send } from 'lucide-react';

export default function GameLobby() {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState<any[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q1 = query(
      collection(db, 'games'), 
      where('hostId', '==', auth.currentUser.uid),
      where('status', 'in', ['waiting', 'playing'])
    );
    const q2 = query(
      collection(db, 'games'),
      where('guestId', '==', auth.currentUser.uid),
      where('status', 'in', ['waiting', 'playing'])
    );

    const unsub1 = onSnapshot(q1, (snapshot) => {
      snapshot.docs.forEach(d => {
        setActiveGameId(d.id);
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'games'));
    
    const unsub2 = onSnapshot(q2, (snapshot) => {
      snapshot.docs.forEach(d => {
        setActiveGameId(d.id);
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'games'));

    const qWait = query(collection(db, 'games'), where('status', '==', 'waiting'));
    const unsubWait = onSnapshot(qWait, (snapshot) => {
      const waitGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(waitGames.filter(g => g.hostId !== auth.currentUser?.uid));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'games'));

    return () => {
      unsub1();
      unsub2();
      unsubWait();
    };
  }, []);

  const createGame = async () => {
    if (!auth.currentUser) return;

    const initialBoard = Array(49).fill('');
    
    const gameId = Math.random().toString(36).substring(2, 10);
    const gameRef = doc(db, 'games', gameId);
    
    try {
      await setDoc(gameRef, {
        status: 'waiting',
        hostId: auth.currentUser.uid,
        guestId: '',
        turn: 'host',
        board: initialBoard,
        winner: '',
        phase: 'placement',
        piecesPlaced: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveGameId(gameId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `games/${gameId}`);
    }
  };

  const joinGame = async (gameId: string) => {
    if (!auth.currentUser) return;
    const gameRef = doc(db, 'games', gameId);
    try {
      await updateDoc(gameRef, {
        status: 'playing',
        guestId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });
      setActiveGameId(gameId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (activeGameId) {
    return <GameBoard gameId={activeGameId} onExit={() => setActiveGameId(null)} />;
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-6 max-w-md mx-auto mt-4">
      <div className="bg-[#8B5E3C] p-6 rounded-2xl text-white shadow-lg">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Start a Match</h3>
        <button 
          onClick={createGame}
          className="w-full bg-[#FDFBF7] text-[#8B5E3C] font-bold py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-white transition-colors"
        >
          {t('create_game')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-[#F4EFE6] pb-2 text-[#4A3728]">{t('available_games')}</h3>
        {games.length === 0 ? (
          <p className="text-[#4A3728] opacity-60 text-sm italic">{t('no_games')}</p>
        ) : (
          <div className="space-y-3">
            {games.map(game => (
              <div key={game.id} className="flex justify-between items-center p-3 bg-[#FDFBF7] rounded-lg border border-[#E8E2D9] hover:border-[#8B5E3C] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-[#4A3728]">Game {game.id}</span>
                </div>
                <button 
                  onClick={() => joinGame(game.id)}
                  className="text-[10px] bg-[#8B5E3C] text-white px-3 py-1.5 rounded uppercase tracking-wider font-bold hover:bg-[#7A5234]"
                >
                  {t('join_game')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <div className="flex justify-around bg-[#E8E2D9] rounded-xl py-3 text-center text-[#4A3728]">
          <div>
            <p className="text-[10px] uppercase font-bold opacity-60">Status</p>
            <p className="text-lg font-bold">Online</p>
          </div>
        </div>
        <p className="text-[9px] text-center opacity-40 uppercase text-[#4A3728]">Built for enthusiasts of cultural gaming heritage.</p>
      </div>
    </div>
  );
}

function GameBoard({ gameId, onExit }: { gameId: string, onExit: () => void }) {
  const { t } = useTranslation();
  const [game, setGame] = useState<any>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gameRef = doc(db, 'games', gameId);
    const unsub = onSnapshot(gameRef, (docSnap) => {
      i
