import type { CSSProperties } from 'react';

// Renders a companion-pet spritesheet (4 frames, 40x40 each) as a CSS
// steps()-animated flap/gallop, scaled to `size`.
export default function PetSprite({ id, size = 40, animate = true }: { id: string; size?: number; animate?: boolean }) {
  const style: CSSProperties & Record<string, string> = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundImage: `url(/game/pets/${id}.png)`,
    backgroundSize: `${size * 4}px ${size}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    '--pet-shift': `-${size * 4}px`,
  };
  return <div className={animate ? 'pet-sprite' : ''} style={style} />;
}
