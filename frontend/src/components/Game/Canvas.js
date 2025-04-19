import React, { useEffect, useRef, useState, useCallback } from 'react';
import collisions from '../../utils/collisions';
import Sprite from './Sprite';
import io from 'socket.io-client';
import './styles.css';
import useGame from './useGame';
import Chat from './chat';
import { MessageCircle } from 'lucide-react';

const Canvas = () => {
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const socketRef = useRef(null);
  const animationFrameRef = useRef(null);
  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    e: false
  });
  const [showChat, setShowChat] = useState(false);
  const [showNameModal, setShowNameModal] = useState(true);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  
  const {
    player,
    setPlayer,
    otherPlayers,
    setOtherPlayers,
    boundaries,
    interactionMenu,
    playerName,
    setPlayerName,
    playerCount,
    setPlayerCount,
    gameContainerRef,
    checkCollision,
    findValidSpawnPosition,
    checkPlayerInteraction,
    checkNearbyPlayers,
    mapImage,
    backgroundImage,
    playerImages
  } = useGame(canvasRef, socketRef, keysRef);

  // Initialize canvas and socket
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    setCtx(context);
    socketRef.current = io('http://localhost:3001');

    return () => {
      socketRef.current.disconnect();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Handle name submission
  const handleNameSubmit = () => {
    if (!tempPlayerName.trim()) return alert('Please enter a valid name');
    setPlayerName(tempPlayerName);
    setShowNameModal(false);
    
    // Register the name with the socket
    if (socketRef.current) {
      socketRef.current.emit('register', tempPlayerName);
    }
  };

  // Game initialization - now depends on playerName being set
  useEffect(() => {
    if (!ctx || !socketRef.current || !playerName || !mapImage) return;

    const initialPlayer = new Sprite({
      position: findValidSpawnPosition(),
      image: playerImages.down,
      frames: { max: 4 },
      sprites: playerImages,
      name: playerName,
      speed: 3
    });
    setPlayer(initialPlayer);
  }, [ctx, playerName, setPlayer, findValidSpawnPosition, mapImage, playerImages]);

  // Handle key presses for interaction
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        checkPlayerInteraction();
      }
      if (e.key in keysRef.current) {
        keysRef.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key in keysRef.current) {
        keysRef.current[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [checkPlayerInteraction]);

  // Mouse events for interaction menu
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      interactionMenu.current.handleMouseMove(mouseX, mouseY);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      interactionMenu.current.handleClick(otherPlayers);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [otherPlayers]);

  // Listen for incoming call popup
  useEffect(() => {
    if (!socketRef.current) return;
    const handleReceiveCall = (data) => {
      setIncomingCall(data);
    };
    socketRef.current.on('receiveCall', handleReceiveCall);
    return () => {
      socketRef.current.off('receiveCall', handleReceiveCall);
    };
  }, []);

  // Patch interaction menu to trigger call
  useEffect(() => {
    if (!interactionMenu.current) return;
    // Save original handleClick
    const originalHandleClick = interactionMenu.current.handleClick.bind(interactionMenu.current);
    interactionMenu.current.handleClick = (otherPlayers) => {
      if (
        interactionMenu.current.visible &&
        interactionMenu.current.selectedOption === 'voiceChat' &&
        interactionMenu.current.targetId
      ) {
        // Send call event to server
        if (socketRef.current) {
          socketRef.current.emit('callUser', {
            targetId: interactionMenu.current.targetId,
            callerName: playerName
          });
        }
        interactionMenu.current.hide();
        return true;
      }
      return originalHandleClick(otherPlayers);
    };
    // Cleanup: restore original on unmount
    return () => {
      interactionMenu.current.handleClick = originalHandleClick;
    };
  }, [interactionMenu, playerName]);

  // Game loop
  const animate = useCallback(() => {
    if (!player || !ctx || !mapImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // Draw map
    ctx.drawImage(mapImage, 0, 0, 1024, 576);

    // Update player movement
    let moved = false;
    const directions = [
      { key: 'ArrowUp', dx: 0, dy: -1, dir: 'up' },
      { key: 'ArrowDown', dx: 0, dy: 1, dir: 'down' },
      { key: 'ArrowLeft', dx: -1, dy: 0, dir: 'left' },
      { key: 'ArrowRight', dx: 1, dy: 0, dir: 'right' }
    ];

    directions.forEach(({ key, dx, dy, dir }) => {
      if (keysRef.current[key]) {
        const newX = player.position.x + dx * player.speed;
        const newY = player.position.y + dy * player.speed;
        
        if (!checkCollision(newX, newY)) {
          player.position.x = newX;
          player.position.y = newY;
          player.setDirection(dir);
          player.moving = true;
          moved = true;
        }
      }
    });

    // Emit movement to server
    if (moved && socketRef.current) {
      socketRef.current.emit('playerMovement', {
        position: player.position,
        direction: player.lastDirection,
        moving: true
      });
    }

    // Check for nearby players
    checkNearbyPlayers();

    // Draw game elements
    Object.values(otherPlayers).forEach(p => {
      if (p instanceof Sprite) {
        p.draw(ctx);
      }
    });
    player.draw(ctx);
    interactionMenu.current.draw(ctx);

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [player, otherPlayers, ctx, checkCollision, checkNearbyPlayers, mapImage, backgroundImage]);

  useEffect(() => {
    if (player && mapImage) {
      animate();
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [animate, player, mapImage]);

  return (
    <div className="game-container" ref={gameContainerRef}>
      {/* Name Input Modal */}
      {showNameModal && (
        <div className="name-modal-backdrop">
          <div className="name-modal">
            <h2  style={{ color: 'black' }}>Enter Your Player Name</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={tempPlayerName}
              onChange={(e) => setTempPlayerName(e.target.value)}
              maxLength="15"
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
            <button onClick={handleNameSubmit}>Start Game</button>
          </div>
        </div>
      )}

      <div className="header-bar">
        <div className="game-logo">Virtual Office</div>
        <div className="player-controls">
          <div className="player-name-display">{playerName}</div>
          <div className="player-count">Players: {playerCount}</div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={1550} height={700} />
        <button 
          className="chat-button"
          onClick={() => setShowChat(!showChat)}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MessageCircle
            style={{
              width: '30px',
              height: '30px'
            }}
          />
        </button>
      </div>
      {/* Incoming Call Popup */}
      {incomingCall && (
        <div
          style={{
            position: 'fixed',
            left: 0, right: 0, top: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              textAlign: 'center',
              minWidth: '320px'
            }}
          >
            <h2 style={{ marginBottom: 16, color: '#4a6cf7' }}>
              Incoming Call
            </h2>
            <div style={{ marginBottom: 24, fontSize: 18 }}>
              {incomingCall.callerName} is calling you...
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
                onClick={() => setIncomingCall(null)}
              >
                Accept
              </button>
              <button
                style={{
                  background: '#ff4b4b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
                onClick={() => setIncomingCall(null)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {showChat && (
        <div 
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '80px',
          width: '800px',
          height: '70vh',
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(74, 108, 247, 0.2)',
          zIndex: 1000,
          overflow: 'hidden',
          border: '2px solid rgba(74, 108, 247, 0.1)',
          background: 'linear-gradient(to bottom right, #ffffff, #f0f4ff)'
        }}
      >
        <button
                onClick={() => setShowChat(false)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  backgroundColor: '#ff4b4b',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  zIndex: 1001
                }}
              >
                ×
              </button>
          <Chat username={playerName} socket={socketRef.current} />
        </div>
      )}
    </div>
  );
};

export default Canvas;