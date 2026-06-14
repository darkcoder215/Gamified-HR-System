import { useEffect, useState } from 'react';
import { EventBus } from '@/game/EventBus';

export type Focus = { kind: 'station' | 'npc' | 'activity' | 'exit'; id: string } | null;

export function useFocus(): Focus {
  const [focus, setFocus] = useState<Focus>(null);
  useEffect(() => {
    const handler = (f: Focus) => setFocus(f);
    EventBus.on('focus:change', handler);
    return () => {
      EventBus.off('focus:change', handler);
    };
  }, []);
  return focus;
}
