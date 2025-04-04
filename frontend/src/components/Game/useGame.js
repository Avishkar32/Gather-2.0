import { useRef, useState, useEffect, useCallback } from 'react';
import collisions from '../../utils/collisions';
import InteractionMenu from './InteractionMenu';
import Sprite from './Sprite';

const BOUNDARY_SIZE = 32;
const INTERACTION_RANGE = 50;
const MAP_WIDTH = 1024;
const MAP_HEIGHT = 576;

const useGame = (canvasRef, socketRef, keysRef) => {
  const [player, setPlayer] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState({});
  const [boundaries, setBoundaries] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState(1);
  const [mapImage, setMapImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [playerImages, setPlayerImages] = useState(null);
  const gameContainerRef = useRef(null);
  const playerProximityState = useRef({});
  const interactionMenu = useRef(new InteractionMenu());

  // Load images
  useEffect(() => {
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };

    const loadAllImages = async () => {
      try {
        const [mapImg, bgImg, downImg, upImg, leftImg, rightImg] = await Promise.all([
          loadImage('/images/map2.png'),
          loadImage('/images/background.png'),
          loadImage('/images/playerDown.png'),
          loadImage('/images/playerUp.png'),
          loadImage('/images/playerLeft.png'),
          loadImage('/images/playerRight.png')
        ]);
        
        setMapImage(mapImg);
        setBackgroundImage(bgImg);
        setPlayerImages({
          down: downImg,
          up: upImg,
          left: leftImg,
          right: rightImg
        });
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    loadAllImages();
  }, []);

  // Initialize boundaries
  useEffect(() => {
    const generated = collisions.flatMap((row, i) =>
      row.map((cell, j) => 
        cell === 1 ? { 
          x: j * BOUNDARY_SIZE,
          y: i * BOUNDARY_SIZE,
          width: BOUNDARY_SIZE - 5,
          height: BOUNDARY_SIZE - 10
        } : null
      ).filter(Boolean)
    );
    setBoundaries(generated);
  }, []);

  // Initialize socket listeners
  useEffect(() => {
    if (!socketRef.current || !playerImages) return;

    const socket = socketRef.current;

    // const handleCurrentPlayers = (players) => {
    //   const playerInfo = players[socket.id];
    //   if (playerInfo) {
    //     const validPosition = findValidSpawnPosition();
    //     const newPlayer = new Sprite({
    //       position: validPosition,
    //       image: playerImages.down,
    //       frames: { max: 4 },
    //       sprites: playerImages,
    //       name: playerInfo.name || `Player-${socket.id.substr(0, 4)}`,
    //       id: socket.id,
    //       speed: 3
    //     });
    //     setPlayer(newPlayer);

    //     const others = {};
    //     Object.entries(players).forEach(([id, data]) => {
    //       if (id !== socket.id) {
    //         others[id] = new Sprite({
    //           position: data.position || { x: 100, y: 100 },
    //           image: playerImages[data.direction] || playerImages.down,
    //           frames: { max: 4 },
    //           sprites: playerImages,
    //           name: data.name,
    //           id: id,
    //           speed: 3,
    //           lastDirection: data.direction || 'down',
    //           moving: data.moving || false
    //         });
    //       }
    //     });
    //     setOtherPlayers(others);
    //     setPlayerCount(Object.keys(players).length);

    //     // Update server with our valid position
    //     socket.emit('playerMovement', {
    //       position: validPosition,
    //       direction: 'down',
    //       moving: false
    //     });
    //   }
    // };


    // In your socket.on('currentPlayers') handler:
const handleCurrentPlayers = (players) => {
  const others = {};
  Object.entries(players).forEach(([id, data]) => {
    others[id] = new Sprite({
      position: data.position,
      image: playerImages[data.direction] || playerImages.down,
      frames: { max: 4 },
      sprites: playerImages,
      name: data.name,
      id: id,
      speed: 3
    });
  });
  setOtherPlayers(others);
  setPlayerCount(Object.keys(players).length + 1); // +1 for local player
};
    const handleNewPlayer = (playerInfo) => {
      setOtherPlayers(prev => ({
        ...prev,
        [playerInfo.id]: new Sprite({
          position: playerInfo.position,
          image: playerImages[playerInfo.direction] || playerImages.down,
          frames: { max: 4 },
          sprites: playerImages,
          name: playerInfo.name,
          id: playerInfo.id,
          speed: 3,
          lastDirection: playerInfo.direction || 'down',
          moving: playerInfo.moving || false
        })
      }));
      setPlayerCount(prev => prev + 1);
    };

    const handlePlayerMoved = (playerInfo) => {
      setOtherPlayers(prev => {
        const existingPlayer = prev[playerInfo.id];
        if (existingPlayer) {
          return {
            ...prev,
            [playerInfo.id]: {
              ...existingPlayer,
              position: playerInfo.position,
              lastDirection: playerInfo.direction,
              moving: playerInfo.moving
            }
          };
        }
        return prev;
      });
    };

    const handlePlayerDisconnected = (playerId) => {
      setOtherPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[playerId];
        return newPlayers;
      });
      setPlayerCount(prev => prev - 1);
    };

    socket.on('currentPlayers', handleCurrentPlayers);
    socket.on('newPlayer', handleNewPlayer);
    socket.on('playerMoved', handlePlayerMoved);
    socket.on('playerDisconnected', handlePlayerDisconnected);

    return () => {
      socket.off('currentPlayers', handleCurrentPlayers);
      socket.off('newPlayer', handleNewPlayer);
      socket.off('playerMoved', handlePlayerMoved);
      socket.off('playerDisconnected', handlePlayerDisconnected);
    };
  }, [socketRef, playerImages]);

  // In your useGame.js, ensure these socket listeners exist:
// In useGame.js
useEffect(() => {
    if (!socketRef.current || !playerImages) return;
  
    const socket = socketRef.current;
  
    const handleNewPlayer = (playerInfo) => {
      setOtherPlayers(prev => ({
        ...prev,
        [playerInfo.id]: new Sprite({
          position: playerInfo.position,
          image: playerImages[playerInfo.direction] || playerImages.down,
          frames: { max: 4 },
          sprites: playerImages,
          name: playerInfo.name,
          id: playerInfo.id
        })
      }));
      setPlayerCount(prev => prev + 1);
    };
  
    // const handlePlayerMoved = (playerInfo) => {
    //   setOtherPlayers(prev => {
    //     const existing = prev[playerInfo.id];
    //     if (existing) {
    //       const updatedPlayer = new Sprite({
    //         ...existing,
    //         position: playerInfo.position,
    //         moving: playerInfo.moving
    //       });
    //       updatedPlayer.setDirection(playerInfo.direction);
    //       return {
    //         ...prev,
    //         [playerInfo.id]: updatedPlayer
    //       };
    //     }
    //     return prev;
    //   });
    // };
  
    // Update the playerMoved handler to maintain Sprite instances
const handlePlayerMoved = (playerInfo) => {
    setOtherPlayers(prev => {
      const existing = prev[playerInfo.id];
      if (existing) {
        // Create NEW Sprite instance with updated properties
        const updatedPlayer = new Sprite({
          position: playerInfo.position,
          image: playerImages[playerInfo.direction] || playerImages.down,
          frames: { max: 4 },
          sprites: playerImages,
          name: existing.name,
          id: existing.id,
          speed: existing.speed,
          lastDirection: playerInfo.direction,
          moving: playerInfo.moving
        });
        return {
          ...prev,
          [playerInfo.id]: updatedPlayer
        };
      }
      return prev;
    });
  };

    socket.on('newPlayer', handleNewPlayer);
    socket.on('playerMoved', handlePlayerMoved);
  
    return () => {
      socket.off('newPlayer', handleNewPlayer);
      socket.off('playerMoved', handlePlayerMoved);
    };
  }, [playerImages]);

  // Collision detection
  const checkCollision = useCallback((x, y) => {
    return boundaries.some(boundary =>
      x < boundary.x + boundary.width &&
      x + 30 > boundary.x &&
      y < boundary.y + boundary.height &&
      y + 30 > boundary.y
    );
  }, [boundaries]);

  // Find valid spawn position
  const findValidSpawnPosition = useCallback(() => {
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * (MAP_WIDTH - 60)) + 30;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - 60)) + 30;
      
      if (!checkCollision(x, y)) {
        return { x, y };
      }
    }
    return { x: 100, y: 100 };
  }, [checkCollision]);

  // Player interactions
  const checkPlayerInteraction = useCallback(() => {
    if (!player) return;

    if (interactionMenu.current.visible) {
      interactionMenu.current.hide();
      return;
    }

    const nearbyPlayer = Object.entries(otherPlayers).find(([id, otherPlayer]) => {
      const dx = player.position.x - otherPlayer.position.x;
      const dy = player.position.y - otherPlayer.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= INTERACTION_RANGE;
    });

    if (nearbyPlayer) {
      const [id, otherPlayer] = nearbyPlayer;
      const centerX = otherPlayer.position.x + otherPlayer.width / 2;
      const centerY = otherPlayer.position.y;
      interactionMenu.current.show(id, { x: centerX, y: centerY });
      
      // Notify other player about the interaction
      socketRef.current?.emit('playerInteraction', { targetId: id });
    }
  }, [player, otherPlayers, socketRef]);

  // Player proximity checks
  const checkNearbyPlayers = useCallback(() => {
    if (!player) return;

    Object.entries(otherPlayers).forEach(([id, otherPlayer]) => {
      const dx = player.position.x - otherPlayer.position.x;
      const dy = player.position.y - otherPlayer.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isNearby = distance <= INTERACTION_RANGE;
      const wasNearby = playerProximityState.current[id] || false;

      playerProximityState.current[id] = isNearby;

      if (!wasNearby && isNearby) {
        console.log(`${otherPlayer.name} is nearby!`);
      } else if (wasNearby && !isNearby) {
        console.log(`${otherPlayer.name} left the area`);
      }
    });
  }, [player, otherPlayers]);

  return {
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
  };
};

export default useGame;