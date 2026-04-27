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
    
    // Subscribe to active games where user is involved
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

    // List waiting games
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
    const initialBoard = [
      ...Array(24).fill('1'),
      '', 
      ...Array(24).fill('2')
    ];
    
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

      {/* Stats Micro-Footer from design */}
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
      if (docSnap.exists()) {
        setGame({ id: docSnap.id, ...docSnap.data() });
      } else {
        onExit();
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `games/${gameId}`));

    const qMsg = query(collection(db, `games/${gameId}/messages`), orderBy('createdAt', 'asc'));
    const unsubMsg = onSnapshot(qMsg, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => {
        if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    }, error => handleFirestoreError(error, OperationType.LIST, `games/${gameId}/messages`));

    return () => {
      unsub();
      unsubMsg();
    };
  }, [gameId, onExit]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !auth.currentUser) return;
    try {
      const newMsgRef = doc(collection(db, `games/${gameId}/messages`));
      await setDoc(newMsgRef, {
        senderId: auth.currentUser.uid,
        text: chatText.trim(),
        createdAt: serverTimestamp()
      });
      setChatText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `games/${gameId}/messages`);
    }
  };

  const [hostName, setHostName] = useState('Player 1');
  const [guestName, setGuestName] = useState('Player 2');

  useEffect(() => {
    if (game?.hostId) {
      getDoc(doc(db, 'users', game.hostId)).then(snap => {
        if (snap.exists() && snap.data().displayName) setHostName(snap.data().displayName);
      }).catch(() => {});
    }
  }, [game?.hostId]);

  useEffect(() => {
    if (game?.guestId) {
      getDoc(doc(db, 'users', game.guestId)).then(snap => {
        if (snap.exists() && snap.data().displayName) setGuestName(snap.data().displayName);
      }).catch(() => {});
    }
  }, [game?.guestId]);

  if (!game) return <div className="p-8 text-center">Loading...</div>;

  const isHost = auth.currentUser?.uid === game.hostId;
  const isGuest = auth.currentUser?.uid === game.guestId;
  const isMyTurn = (isHost && game.turn === 'host') || (isGuest && game.turn === 'guest');

  const getValidMoves = (idx: number, board: string[]) => {
    const moves: number[] = [];
    const r = Math.floor(idx / 7);
    const c = idx % 7;
    
    // Simple orthogonal adjacent moves
    const directions = [[-1,0],[1,0],[0,-1],[0,1]];
    directions.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 7 && nc >= 0 && nc < 7) {
        const nIdx = nr * 7 + nc;
        if (board[nIdx] === '') moves.push(nIdx);
      }
    });

    // Capture logic (jump over one opponent piece)
    directions.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      const jn = r + 2*dr, jc = c + 2*dc;
      if (nr >= 0 && nr < 7 && nc >= 0 && nc < 7 && jn >= 0 && jn < 7 && jc >= 0 && jc < 7) {
        const nIdx = nr * 7 + nc;
        const jIdx = jn * 7 + jc;
        const opp = isHost ? '2' : '1';
        if (board[nIdx] === opp && board[jIdx] === '') moves.push(jIdx);
      }
    });

    return moves;
  };

  const handleCellClick = async (idx: number) => {
    if (!isMyTurn || game.status !== 'playing') return;

    const myPiece = isHost ? '1' : '2';

    if (game.board[idx] === myPiece) {
      setSelectedIdx(idx);
    } else if (selectedIdx !== null && game.board[idx] === '') {
      const validMoves = getValidMoves(selectedIdx, game.board);
      if (validMoves.includes(idx)) {
        const newBoard = [...game.board];
        newBoard[idx] = myPiece;
        newBoard[selectedIdx] = '';

        // Check if it was a capture
        const r1 = Math.floor(selectedIdx / 7), c1 = selectedIdx % 7;
        const r2 = Math.floor(idx / 7), c2 = Math.floor(idx % 7);
        if (Math.abs(r1-r2) === 2 || Math.abs(c1-c2) === 2) {
          const mr = (r1+r2)/2;
          const mc = (c1+c2)/2;
          newBoard[mr*7 + mc] = '';
        }

        const newTurn = isHost ? 'guest' : 'host';
        
        // Simple win check
        const oppPiece = isHost ? '2' : '1';
        const hasOppPieces = newBoard.includes(oppPiece);
        const status = hasOppPieces ? 'playing' : 'finished';
        const winner = hasOppPieces ? '' : (isHost ? 'host' : 'guest');

        try {
          await updateDoc(doc(db, 'games', gameId), {
            board: newBoard,
            turn: newTurn,
            status,
            winner,
            updatedAt: serverTimestamp()
          });
          setSelectedIdx(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
        }
      } else {
        setSelectedIdx(null);
      }
    } else {
      setSelectedIdx(null);
    }
  };

  const handlePlayAgain = async () => {
    const initialBoard = [
      ...Array(24).fill('1'),
      '', 
      ...Array(24).fill('2')
    ];
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'playing',
        turn: 'host',
        board: initialBoard,
        winner: '',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const renderCell = (idx: number) => {
    const content = game.board[idx];
    const isSelected = selectedIdx === idx;
    
    // Checkered background
    const isEven = (Math.floor(idx / 7) + (idx % 7)) % 2 === 0;
    
    return (
      <div 
        key={idx}
        onClick={() => handleCellClick(idx)}
        className={cn(
          "w-full pt-[100%] relative cursor-pointer",
          isEven ? "bg-[#FDFBF7]" : "bg-[#D9D1C5]"
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {content === '1' && (
            <div className={cn(
              "w-[75%] h-[75%] bg-stone-400 rounded-lg shadow-md border-b-4 border-stone-600 transition-transform",
              isSelected ? "ring-2 ring-offset-2 ring-[#8B5E3C] scale-105" : ""
            )}>
            </div> // Rock
          )}
          {content === '2' && (
            <div className={cn(
              "w-[35%] h-[75%] bg-[#3E2723] rounded-full shadow-md border-l-2 border-[#5D4037] transition-transform",
              isSelected ? "ring-2 ring-offset-2 ring-[#8B5E3C] scale-105" : ""
            )}>
            </div> // Date pit
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-6 w-full max-w-2xl mx-auto mt-4">
      {/* Game info header */}
      <div className="flex justify-between items-center w-full bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#4A3728]">{t('app_name')}</h2>
          <div className="text-[10px] text-[#4A3728] opacity-60 uppercase font-bold tracking-widest mt-1">
            {isHost ? t('rocks') : t('date_pits')}
          </div>
        </div>
        <button onClick={onExit} className="px-3 py-1 bg-[#E8E2D9] text-[#4A3728] rounded text-[10px] uppercase font-bold hover:bg-[#D9D1C5]">
          Exit Game
        </button>
      </div>

      <div className="bg-white p-4 w-full rounded-xl border border-[#E8E2D9] shadow-sm text-center flex flex-col gap-3">
        <div className="flex justify-between w-full items-center">
          <div className={cn("text-xs font-bold uppercase tracking-widest flex flex-col items-start gap-1", game.turn === 'host' ? "text-[#8B5E3C]" : "text-[#4A3728] opacity-60")}>
            <span>{hostName}</span>
            <span className="text-[9px] px-2 py-0.5 bg-[#E8E2D9] rounded">{t('rocks')}</span>
          </div>
          <div className="text-[10px] font-bold text-[#4A3728] opacity-40 uppercase tracking-widest">VS</div>
          <div className={cn("text-xs font-bold uppercase tracking-widest flex flex-col items-end gap-1", game.turn === 'guest' ? "text-[#8B5E3C]" : "text-[#4A3728] opacity-60")}>
            <span>{game.guestId ? guestName : 'Waiting...'}</span>
            <span className="text-[9px] px-2 py-0.5 bg-[#E8E2D9] rounded">{t('date_pits')}</span>
          </div>
        </div>

        <div className="w-full h-px bg-[#E8E2D9]"></div>

        {game.status === 'waiting' && (
          <p className="text-[#8B5E3C] animate-pulse font-bold text-sm uppercase tracking-wider">
            {t('waiting_for_opponent')}
          </p>
        )}
        {game.status === 'playing' && (
          <p className={cn("text-lg font-bold uppercase tracking-widest", isMyTurn ? "text-[#8B5E3C]" : "text-[#4A3728] opacity-60")}>
            {isMyTurn ? t('your_turn') : t('opponent_turn')}
          </p>
        )}
        {game.status === 'finished' && (
          <div className="flex flex-col items-center gap-3">
            <p className={cn("text-xl font-bold uppercase tracking-widest", game.winner === (isHost ? 'host' : 'guest') ? "text-emerald-600" : "text-red-700")}>
              {game.winner === (isHost ? 'host' : 'guest') ? t('you_win') : t('you_lose')}
            </p>
            <button 
              onClick={handlePlayAgain}
              className="bg-[#8B5E3C] text-white px-4 py-2 rounded font-bold uppercase text-[10px] tracking-wider hover:bg-[#7A5234]"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Board Container */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[400px]">
          <div className="bg-[#E8E2D9] p-2 md:p-4 rounded-xl shadow-xl border-4 border-[#D9D1C5]">
            <div className="grid grid-cols-7 gap-[2px] md:gap-1 bg-[#4A3728]">
              {Array(49).fill(null).map((_, i) => renderCell(i))}
            </div>
          </div>
          
          <div className="flex justify-between w-full text-[10px] md:text-xs font-bold opacity-70 uppercase tracking-widest mt-4 px-2 text-[#4A3728]">
            <span>Board Grid: 7 x 7</span>
            <span>{isMyTurn ? "Your Turn" : "Wait"}</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-8 mt-2">
        <div className="flex items-center space-x-3">
           <div className="w-5 h-5 bg-stone-400 rounded shadow-sm border-b-2 border-stone-600"></div>
           <span className="text-[10px] uppercase font-bold text-[#4A3728] tracking-wider">{t('rocks')}</span>
        </div>
        <div className="flex items-center space-x-3">
           <div className="w-3 h-5 bg-[#3E2723] rounded-full shadow-sm border-l border-[#5D4037]"></div>
           <span className="text-[10px] uppercase font-bold text-[#4A3728] tracking-wider">{t('date_pits')}</span>
        </div>
      </div>

      {/* Chat Feature */}
      <div className="w-full bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-sm flex flex-col h-64 mt-4">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#4A3728] border-b border-[#F4EFE6] pb-2 mb-2">Match Chat</h3>
        <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
          {messages.length === 0 ? (
            <p className="text-xs text-center italic text-[#4A3728] opacity-50 mt-4">No messages yet. Say Assalamu alaikum!</p>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === auth.currentUser?.uid;
              return (
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                    isMine ? "bg-[#8B5E3C] text-white rounded-br-none" : "bg-[#E8E2D9] text-[#4A3728] rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={sendMessage} className="mt-3 flex gap-2">
          <input 
            type="text" 
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            disabled={game.status === 'waiting'}
            placeholder={game.status === 'waiting' ? "Waiting for opponent..." : "Type a message..."}
            className="flex-1 px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D9] rounded-lg text-sm focus:outline-none focus:border-[#8B5E3C]"
          />
          <button 
            type="submit" 
            disabled={!chatText.trim() || game.status === 'waiting'}
            className="bg-[#8B5E3C] text-white p-2 rounded-lg disabled:opacity-50 hover:bg-[#7A5234]"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
