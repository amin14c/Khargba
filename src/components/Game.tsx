import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
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
import { playSound } from '../lib/sounds';
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
      setGames(waitGames.filter(g => (g as any).hostId !== auth.currentUser?.uid));
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveGameId(gameId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `games/${gameId}`);
    }
  };

  const createBotGame = async () => {
    if (!auth.currentUser) return;
    const initialBoard = Array(49).fill('');
    
    const gameId = Math.random().toString(36).substring(2, 10);
    const gameRef = doc(db, 'games', gameId);
    
    try {
      await setDoc(gameRef, {
        status: 'playing',
        hostId: auth.currentUser.uid,
        guestId: 'bot',
        turn: 'host',
        board: initialBoard,
        winner: '',
        phase: 'placement',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveGameId(gameId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `games/${gameId}`);
    }
  };

  const createLocalGame = async () => {
    if (!auth.currentUser) return;
    const initialBoard = Array(49).fill('');
    
    const gameId = Math.random().toString(36).substring(2, 10);
    const gameRef = doc(db, 'games', gameId);
    
    try {
      await setDoc(gameRef, {
        status: 'playing',
        hostId: auth.currentUser.uid,
        guestId: 'local',
        turn: 'host',
        board: initialBoard,
        winner: '',
        phase: 'placement',
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
    <div className="w-full flex-1 flex flex-col gap-6 max-w-md mx-auto mt-4 font-serif">
      <div className="luxury-panel p-8 text-center space-y-4">
        <h3 className="text-xl font-display font-bold uppercase tracking-widest luxury-text-gold">Start a Match</h3>
        <p className="text-[10px] uppercase font-sans tracking-widest text-[#E6D5B8] opacity-60">
          Create a new session and wait for a challenger
        </p>
        <div className="flex gap-4 mt-2">
          <button 
            onClick={createGame}
            className="flex-1 luxury-btn-primary py-4 rounded-[4px] text-xs font-display"
          >
            {t('create_game')}
          </button>
          <button 
            onClick={createBotGame}
            className="flex-1 luxury-btn-primary py-4 rounded-[4px] text-xs font-display"
          >
            Play vs AI
          </button>
          <button 
            onClick={createLocalGame}
            className="flex-1 luxury-btn-primary py-4 rounded-[4px] text-xs font-display"
          >
            Pass & Play
          </button>
        </div>
      </div>

      <div className="luxury-panel p-6 flex flex-col pt-8">
        <h3 className="text-sm font-display font-bold uppercase tracking-[0.2em] mb-4 pb-3 border-b border-[rgba(212,175,55,0.15)] luxury-text-gold">{t('available_games')}</h3>
        {games.length === 0 ? (
          <p className="text-[#E6D5B8] opacity-40 text-xs italic tracking-wide text-center py-4">{t('no_games')}</p>
        ) : (
          <div className="space-y-3 mt-2">
            {games.map(game => (
              <div key={game.id} className="flex justify-between items-center p-4 bg-[#12100E]/50 rounded-[4px] border border-[rgba(212,175,55,0.2)] hover:border-[#D4AF37] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"></div>
                  <span className="text-sm font-bold text-[#E6D5B8] uppercase tracking-widest font-display">Session {game.id}</span>
                </div>
                <button 
                  onClick={() => joinGame(game.id)}
                  className="luxury-btn px-4 py-2 rounded-[2px] text-[10px]"
                >
                  {t('join_game')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Micro-Footer from design */}
      <div className="mt-auto flex flex-col gap-3 py-6">
        <div className="flex justify-around items-center bg-[#12100E] border border-[rgba(212,175,55,0.15)] rounded-lg py-4 text-center">
          <div>
            <p className="text-[9px] uppercase font-bold text-[#D4AF37] opacity-60 font-display tracking-[0.2em]">Network Status</p>
            <p className="text-sm font-bold text-[#E6D5B8] uppercase tracking-widest mt-1 shadow-sm flex items-center justify-center gap-2">
              <span className="block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronized
            </p>
          </div>
        </div>
        <p className="text-[9px] text-center opacity-40 uppercase tracking-[0.25em] text-[#D4AF37] font-display">Built for enthusiasts of cultural gaming heritage.</p>
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
      if (game.guestId === 'bot') {
        setGuestName('Computer');
      } else if (game.guestId === 'local') {
        setGuestName('Player 2 (Local)');
      } else {
        getDoc(doc(db, 'users', game.guestId)).then(snap => {
          if (snap.exists() && snap.data().displayName) setGuestName(snap.data().displayName);
        }).catch(() => {});
      }
    }
  }, [game?.guestId]);

  const prevGameRef = useRef<any>(null);

  useEffect(() => {
    if (game && prevGameRef.current) {
      const prev = prevGameRef.current;
      
      if (prev.status === 'playing' && game.status === 'finished') {
        const isHost = auth.currentUser?.uid === game.hostId;
        const myRole = isHost ? 'host' : 'guest';
        if (game.winner === myRole) {
          playSound('win');
        } else {
          playSound('lose');
        }
      }
      
      if (prev.board && game.board && prev.turn !== game.turn) {
        let prevPieces = 0;
        let currPieces = 0;
        for (let i = 0; i < 49; i++) {
          if (prev.board[i] !== '') prevPieces++;
          if (game.board[i] !== '') currPieces++;
        }
        
        if (currPieces > prevPieces) {
           playSound('place');
        } else if (currPieces < prevPieces) {
           playSound('capture');
        } else {
           playSound('move');
        }
      }
    }
    
    if (game) {
      prevGameRef.current = game;
    }
  }, [game, auth.currentUser?.uid]);

  const isHost = auth.currentUser?.uid === game?.hostId;

  useEffect(() => {
    if (game?.status === 'playing' && game.guestId === 'bot' && game.turn === 'guest' && isHost) {
      const timer = setTimeout(() => {
        const currentBoard = game.board;
        let numPlaced = 0;
        for (let i = 0; i < currentBoard.length; i++) {
            if (currentBoard[i] !== '') numPlaced++;
        }
        const isPlacementPhase = game.phase === 'placement' || (game.phase === undefined && numPlaced < 48);
        const botPiece = '2';
        const oppPiece = '1';
        
        let targetIdx = -1;
        let pidx = -1;
        
        if (isPlacementPhase) {
          const emptyIndices = [];
          for (let i = 0; i < 49; i++) {
            if (i !== 24 && currentBoard[i] === '') emptyIndices.push(i);
          }
          if (emptyIndices.length > 0) {
            targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }
        } else {
          const botPieces = [];
          for (let i=0; i<49; i++) {
            if (currentBoard[i] === botPiece) botPieces.push(i);
          }
          const validMovesAndPieces = [];
          for (let p of botPieces) {
             const mvs = getValidMoves(p, currentBoard);
             for(let m of mvs) {
               validMovesAndPieces.push({p, m});
             }
          }
          if (validMovesAndPieces.length > 0) {
            const mv = validMovesAndPieces[Math.floor(Math.random() * validMovesAndPieces.length)];
            pidx = mv.p;
            targetIdx = mv.m;
          }
        }
        
        if (targetIdx !== -1) {
           const newBoard = [...currentBoard];
           newBoard[targetIdx] = botPiece;
           let newTurn = 'host';
           
           if (isPlacementPhase) {
             const nextNumPlaced = numPlaced + 1;
             const isLastPlacement = nextNumPlaced === 48;
             if (!isLastPlacement) {
                const nextIsGuestTurn = (Math.floor(nextNumPlaced / 2) % 2) === 1;
                newTurn = nextIsGuestTurn ? 'guest' : 'host';
             } else {
                newTurn = 'host';
             }
             const updates: any = { board: newBoard, turn: newTurn, updatedAt: serverTimestamp() };
             if (isLastPlacement) updates.phase = 'movement';
             setGame((prev: any) => ({ ...prev, board: newBoard, turn: newTurn, phase: updates.phase || prev.phase }));
             updateDoc(doc(db, 'games', gameId), updates).catch(() => {});
           } else {
             newBoard[pidx] = '';
             let capturedSomething = false;
             const r = Math.floor(targetIdx / 7);
             const c = targetIdx % 7;
             
              if (r >= 2 && newBoard[(r-1)*7 + c] === oppPiece && newBoard[(r-2)*7 + c] === botPiece) { newBoard[(r-1)*7 + c] = ''; capturedSomething = true; }
              if (r <= 4 && newBoard[(r+1)*7 + c] === oppPiece && newBoard[(r+2)*7 + c] === botPiece) { newBoard[(r+1)*7 + c] = ''; capturedSomething = true; }
              if (c >= 2 && newBoard[r*7 + (c-1)] === oppPiece && newBoard[r*7 + (c-2)] === botPiece) { newBoard[r*7 + (c-1)] = ''; capturedSomething = true; }
              if (c <= 4 && newBoard[r*7 + (c+1)] === oppPiece && newBoard[r*7 + (c+2)] === botPiece) { newBoard[r*7 + (c+1)] = ''; capturedSomething = true; }
              
              if (capturedSomething) {
                let canCapture = false;
                for (let i = 0; i < 49; i++) {
                  if (newBoard[i] === botPiece) {
                    const tempMoves = getValidMoves(i, newBoard);
                    for (const move of tempMoves) {
                      const tempBoard = [...newBoard];
                      tempBoard[move] = botPiece;
                      tempBoard[i] = '';
                      const tr = Math.floor(move / 7);
                      const tc = move % 7;
                      if (tr >= 2 && tempBoard[(tr-1)*7 + tc] === oppPiece && tempBoard[(tr-2)*7 + tc] === botPiece) canCapture = true;
                      if (tr <= 4 && tempBoard[(tr+1)*7 + tc] === oppPiece && tempBoard[(tr+2)*7 + tc] === botPiece) canCapture = true;
                      if (tc >= 2 && tempBoard[tr*7 + (tc-1)] === oppPiece && tempBoard[tr*7 + (tc-2)] === botPiece) canCapture = true;
                      if (tc <= 4 && tempBoard[tr*7 + (tc+1)] === oppPiece && tempBoard[tr*7 + (tc+2)] === botPiece) canCapture = true;
                    }
                  }
                }
                if (canCapture) {
                  newTurn = game.turn;
                }
              }
              
              let oppCount = 0;
              for (let i = 0; i < 49; i++) {
                if (newBoard[i] === oppPiece) oppCount++;
              }
              
              const status = oppCount <= 1 ? 'finished' : 'playing';
              const winner = oppCount <= 1 ? 'guest' : '';
              
              setGame((prev: any) => ({ ...prev, board: newBoard, turn: newTurn, status, winner }));
              updateDoc(doc(db, 'games', gameId), {
                board: newBoard, turn: newTurn, status, winner, updatedAt: serverTimestamp()
              }).catch(() => {});
           }
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [game?.status, game?.guestId, game?.turn, isHost, game?.board, game?.phase, gameId]);

  if (!game) return <div className="p-8 text-center">Loading...</div>;

  const isGuest = auth.currentUser?.uid === game.guestId;
  const isLocalGame = game.guestId === 'local';
  const isMyTurn = isLocalGame || (isHost && game.turn === 'host') || (isGuest && game.turn === 'guest');

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

    return moves;
  };

  const handleCellClick = async (idx: number) => {
    if (!isMyTurn || game.status !== 'playing') return;

    const myPiece = isLocalGame ? (game.turn === 'host' ? '1' : '2') : (isHost ? '1' : '2');
    
    // Count pieces on board
    let numPlaced = 0;
    for (let i = 0; i < game.board.length; i++) {
        if (game.board[i] !== '') numPlaced++;
    }

    const isPlacementPhase = game.phase === 'placement' || (game.phase === undefined && numPlaced < 48);

    if (isPlacementPhase) {
        if (idx === 24) return; // Center cell remains empty during placement
        if (game.board[idx] === '') {
            const newBoard = [...game.board];
            newBoard[idx] = myPiece;
            const nextNumPlaced = numPlaced + 1;
            const isLastPlacement = nextNumPlaced === 48;
            
            let newTurn = game.turn;
            if (!isLastPlacement) {
               const nextIsHostTurn = (Math.floor(nextNumPlaced / 2) % 2) === 0;
               newTurn = nextIsHostTurn ? 'host' : 'guest';
            } else {
               newTurn = 'host';
            }
            
            const updates: any = {
                board: newBoard,
                turn: newTurn,
                updatedAt: serverTimestamp()
            };
            
            if (isLastPlacement) {
                updates.phase = 'movement';
            }

            setGame((prev: any) => ({ ...prev, board: newBoard, turn: newTurn, phase: updates.phase || prev.phase }));

            try {
              updateDoc(doc(db, 'games', gameId), updates).catch(error => {
                handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
            }
        }
    } else {
        // Movement phase
        if (game.board[idx] === myPiece) {
          setSelectedIdx(idx);
        } else if (selectedIdx !== null && game.board[idx] === '') {
          const validMoves = getValidMoves(selectedIdx, game.board);
          if (validMoves.includes(idx)) {
            const newBoard = [...game.board];
            newBoard[idx] = myPiece;
            newBoard[selectedIdx] = '';

            // Sandwich capture logic
            const oppPiece = myPiece === '1' ? '2' : '1';
            const r = Math.floor(idx / 7);
            const c = idx % 7;
            
            let capturedSomething = false;

            // Up
            if (r >= 2 && newBoard[(r-1)*7 + c] === oppPiece && newBoard[(r-2)*7 + c] === myPiece) {
              newBoard[(r-1)*7 + c] = '';
              capturedSomething = true;
            }
            // Down
            if (r <= 4 && newBoard[(r+1)*7 + c] === oppPiece && newBoard[(r+2)*7 + c] === myPiece) {
              newBoard[(r+1)*7 + c] = '';
              capturedSomething = true;
            }
            // Left
            if (c >= 2 && newBoard[r*7 + (c-1)] === oppPiece && newBoard[r*7 + (c-2)] === myPiece) {
              newBoard[r*7 + (c-1)] = '';
              capturedSomething = true;
            }
            // Right
            if (c <= 4 && newBoard[r*7 + (c+1)] === oppPiece && newBoard[r*7 + (c+2)] === myPiece) {
              newBoard[r*7 + (c+1)] = '';
              capturedSomething = true;
            }

            let newTurn = game.turn === 'host' ? 'guest' : 'host';
            
            if (capturedSomething) {
              let canCapture = false;
              for (let i = 0; i < 49; i++) {
                if (newBoard[i] === myPiece) {
                  const tempMoves = getValidMoves(i, newBoard);
                  for (const move of tempMoves) {
                    const tempBoard = [...newBoard];
                    tempBoard[move] = myPiece;
                    tempBoard[i] = '';
                    const tr = Math.floor(move / 7);
                    const tc = move % 7;
                    if (tr >= 2 && tempBoard[(tr-1)*7 + tc] === oppPiece && tempBoard[(tr-2)*7 + tc] === myPiece) canCapture = true;
                    if (tr <= 4 && tempBoard[(tr+1)*7 + tc] === oppPiece && tempBoard[(tr+2)*7 + tc] === myPiece) canCapture = true;
                    if (tc >= 2 && tempBoard[tr*7 + (tc-1)] === oppPiece && tempBoard[tr*7 + (tc-2)] === myPiece) canCapture = true;
                    if (tc <= 4 && tempBoard[tr*7 + (tc+1)] === oppPiece && tempBoard[tr*7 + (tc+2)] === myPiece) canCapture = true;
                  }
                }
              }
              if (canCapture) {
                newTurn = game.turn;
              }
            }
            
            // Win check: opponent has <= 1 piece left
            let oppCount = 0;
            for (let i = 0; i < 49; i++) {
              if (newBoard[i] === oppPiece) oppCount++;
            }
            
            const status = oppCount <= 1 ? 'finished' : 'playing';
            const winner = oppCount <= 1 ? game.turn : '';

            setSelectedIdx(null);
            setGame((prev: any) => ({ ...prev, board: newBoard, turn: newTurn, status, winner }));
            
            try {
              updateDoc(doc(db, 'games', gameId), {
                board: newBoard,
                turn: newTurn,
                status,
                winner,
                updatedAt: serverTimestamp()
              }).catch(error => {
                handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
            }
          } else {
            setSelectedIdx(null);
          }
        } else {
          setSelectedIdx(null);
        }
    }
  };

  const handlePlayAgain = async () => {
    const initialBoard = Array(49).fill('');
    
    setGame((prev: any) => ({ ...prev, status: 'playing', turn: 'host', board: initialBoard, winner: '', phase: 'placement' }));
    
    try {
      updateDoc(doc(db, 'games', gameId), {
        status: 'playing',
        turn: 'host',
        board: initialBoard,
        winner: '',
        phase: 'placement',
        updatedAt: serverTimestamp()
      }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
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
          "w-full pt-[100%] relative cursor-pointer outline-none transition-colors duration-150",
          isEven ? "board-cell-light hover:brightness-110 hover:shadow-[inset_0_0_15px_rgba(212,175,55,0.4)]" : "board-cell-dark hover:brightness-110 hover:shadow-[inset_0_0_20px_rgba(212,175,55,0.4)]"
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {content === '1' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: isSelected ? 1.05 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
              "w-[75%] h-[75%] piece-host",
              isSelected ? "ring-2 ring-offset-2 ring-offset-[#5a452a] ring-[#D4AF37]" : ""
            )}>
            </motion.div>
          )}
          {content === '2' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: isSelected ? 1.05 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
              "w-[45%] h-[45%] piece-guest",
              isSelected ? "ring-2 ring-offset-2 ring-offset-[#5a452a] ring-[#D4AF37]" : ""
            )}>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-6 w-full max-w-2xl mx-auto mt-4 font-serif">
      {/* Game info header */}
      <div className="flex justify-between items-center w-full luxury-panel p-4">
        <div>
          <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em] luxury-text-gold">{t('app_name')}</h2>
          <div className="text-[10px] text-[#E6D5B8] opacity-60 uppercase font-bold tracking-[0.3em] mt-1 font-display">
            {isHost ? t('rocks') : t('date_pits')}
          </div>
        </div>
        <button onClick={onExit} className="luxury-btn px-4 py-2 rounded-[2px] text-[10px] tracking-widest font-bold">
          Exit Room
        </button>
      </div>

      <div className="luxury-panel p-6 w-full text-center flex flex-col gap-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#D4AF37] opacity-[0.03] blur-3xl rounded-full"></div>
        
        <div className="flex justify-between w-full flex-wrap items-center relative z-10">
          <div className="flex flex-col items-start gap-1">
            <span className={cn("text-xs md:text-sm font-display font-bold uppercase tracking-widest", game.turn === 'host' ? "text-[#E6D5B8] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "text-[#D4AF37] opacity-60")}>{hostName}</span>
            <span className="text-[9px] px-2 py-0.5 border border-[#4a3a2a] text-[#E6D5B8] opacity-80 uppercase tracking-widest rounded bg-[#12100E] font-display">{t('rocks')}</span>
          </div>
          <div className="text-[11px] font-bold luxury-text-gold uppercase tracking-[0.4em] font-display">VS</div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn("text-xs md:text-sm font-display font-bold uppercase tracking-widest", game.turn === 'guest' ? "text-[#E6D5B8] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "text-[#D4AF37] opacity-60")}>{game.guestId ? guestName : 'Waiting...'}</span>
            <span className="text-[9px] px-2 py-0.5 border border-[#4a3a2a] text-[#E6D5B8] opacity-80 uppercase tracking-widest rounded bg-[#12100E] font-display">{t('date_pits')}</span>
          </div>
        </div>

        <div className="w-full h-px bg-[rgba(212,175,55,0.15)] my-2"></div>

        {game.status === 'waiting' && (
          <p className="luxury-text-gold animate-pulse font-display text-sm md:text-base uppercase tracking-[0.2em]">
            {t('waiting_for_opponent')}
          </p>
        )}
        {game.status === 'playing' && (
          <p className={cn("text-base md:text-lg font-display uppercase tracking-[0.2em] drop-shadow-md", isMyTurn ? "luxury-text-gold font-bold" : "text-[#E6D5B8] opacity-50")}>
            {isMyTurn ? t('your_turn') : t('opponent_turn')}
          </p>
        )}
        {game.status === 'finished' && (
          <div className="flex flex-col items-center gap-4">
            <p className={cn("text-xl md:text-2xl font-display font-bold uppercase tracking-[0.3em] drop-shadow-lg", game.winner === (isHost ? 'host' : 'guest') ? "text-[#D4AF37]" : "text-red-900/80")}>
              {game.winner === (isHost ? 'host' : 'guest') ? t('you_win') : t('you_lose')}
            </p>
            <button 
              onClick={handlePlayAgain}
              className="luxury-btn-primary px-8 py-3 rounded-[4px] text-xs"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Board Container */}
      <div className="w-full flex justify-center py-4">
        <div className="w-full max-w-[420px]">
          <div className="board-outer">
            <div className="grid grid-cols-7 gap-0 border-4 board-grid">
              {Array(49).fill(null).map((_, i) => renderCell(i))}
            </div>
          </div>
          
          <div className="flex justify-between w-full text-[10px] md:text-xs font-display font-bold uppercase tracking-[0.3em] mt-8 px-2 text-[#D4AF37] opacity-70">
            <span>Grid: 7 x 7</span>
            <span>{isMyTurn ? "Action Req" : "Standby"}</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-10 mt-2 px-6 py-4 luxury-panel">
        <div className="flex items-center space-x-4">
           <div className="w-6 h-6 piece-host"></div>
           <span className="text-[10px] uppercase font-bold text-[#E6D5B8] tracking-[0.2em] font-display">{t('rocks')}</span>
        </div>
        <div className="flex items-center space-x-4">
           <div className="w-4 h-4 piece-guest"></div>
           <span className="text-[10px] uppercase font-bold text-[#E6D5B8] tracking-[0.2em] font-display">{t('date_pits')}</span>
        </div>
      </div>

      {/* Chat Feature */}
      <div className="w-full luxury-panel flex flex-col h-72 my-4">
        <h3 className="text-[10px] font-display uppercase font-bold tracking-[0.25em] luxury-text-gold border-b border-[rgba(212,175,55,0.15)] pb-4 pt-5 px-6 m-0">Room Ledger</h3>
        <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
          {messages.length === 0 ? (
            <p className="text-xs text-center text-[#E6D5B8] opacity-40 mt-4 font-display uppercase tracking-widest leading-loose">The records are empty.<br/>Speak, traveler.</p>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === auth.currentUser?.uid;
              const timeString = msg.createdAt?.toDate 
                ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : '';
                
              return (
                <div key={msg.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] px-4 py-2.5 rounded text-sm drop-shadow-md border",
                    isMine ? "bg-[#2c241b] text-[#D4AF37] rounded-br-[2px] border-[rgba(212,175,55,0.5)]" : "bg-[#12100E] text-[#E6D5B8] rounded-bl-[2px] border-[#4a3a2a]"
                  )}>
                    {msg.text}
                  </div>
                  {timeString && (
                    <span className="text-[9px] text-[#E6D5B8] opacity-40 font-display mt-1 px-1 tracking-wider">
                      {timeString}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-[rgba(212,175,55,0.15)] bg-black/20 flex gap-3">
          <input 
            type="text" 
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            disabled={game.status === 'waiting'}
            placeholder={game.status === 'waiting' ? "Waiting for opponent..." : "Inscribe a message..."}
            className="flex-1 px-4 py-2 bg-[#12100E] border border-[#4a3a2a] rounded-[4px] text-sm text-[#E6D5B8] placeholder:text-[#E6D5B8]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!chatText.trim() || game.status === 'waiting'}
            className="luxury-btn-primary px-4 py-2 rounded-[4px] disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
