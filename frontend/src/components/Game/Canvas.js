import React, { useEffect, useRef, useState, useCallback } from 'react';
import collisions  from '../../utils/collisions';
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

  // Game initialization
  useEffect(() => {
    if (!ctx || !socketRef.current) return;

    // Initialize game when map loads
    if (mapImage) {
      const initialPlayer = new Sprite({
        position: findValidSpawnPosition(),
        image: playerImages.down,
        frames: { max: 4 },
        sprites: playerImages,
        name: playerName || `Player-${socketRef.current.id?.substr(0, 4)}`,
        speed: 3
      });
      setPlayer(initialPlayer);
    }
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

  //Game loop
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
      <div className="header-bar">
        <div className="game-logo">Virtual Office</div>
        <div className="player-controls">
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (player) {
                player.name = e.target.value;
                socketRef.current?.emit('updateName', e.target.value);
              }
            }}
            placeholder="Enter your name"
            maxLength="15"
          />
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
      {showChat && (
        <div 
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '80px',
            width: '800px',         // Increased from 400px
            height: '70vh',         // Changed to viewport height
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 1000,
            overflow: 'hidden'      // Added overflow control
          }}
        >
          <Chat />
        </div>
      )}
    </div>
  );
};

export default Canvas;