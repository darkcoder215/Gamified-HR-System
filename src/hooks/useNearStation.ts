import { useEffect, useState } from 'react';
import { EventBus } from '@/game/EventBus';
import type { StationId } from '@/types';

export function useNearStation(): StationId | null {
  const [near, setNear] = useState<StationId | null>(null);
  useEffect(() => {
    const handler = (p: { stationId: StationId | null }) => setNear(p.stationId);
    EventBus.on('station:near', handler);
    return () => {
      EventBus.off('station:near', handler);
    };
  }, []);
  return near;
}
