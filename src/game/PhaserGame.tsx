import { useLayoutEffect, useRef } from 'react';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import WorldScene from './scenes/WorldScene';

const CONTAINER_ID = 'phaser-root';

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useLayoutEffect(() => {
    // Guard so React StrictMode's double-invoke doesn't create two canvases.
    if (gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: CONTAINER_ID,
      backgroundColor: '#3e7a4f',
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
      },
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [BootScene, WorldScene],
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id={CONTAINER_ID} className="absolute inset-0 z-0" />;
}
