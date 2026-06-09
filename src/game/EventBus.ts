// A tiny standalone event emitter — the single seam between the Phaser world
// and the React app. Kept Phaser-free so it can live in the main bundle while
// Phaser itself stays in a lazily-loaded chunk.
type Handler = (payload?: any) => void;

interface Entry {
  fn: Handler;
  ctx?: unknown;
}

class Emitter {
  private map = new Map<string, Entry[]>();

  on(event: string, fn: Handler, ctx?: unknown) {
    const list = this.map.get(event) ?? [];
    list.push({ fn, ctx });
    this.map.set(event, list);
  }

  off(event: string, fn: Handler, ctx?: unknown) {
    const list = this.map.get(event);
    if (!list) return;
    this.map.set(
      event,
      list.filter((e) => !(e.fn === fn && e.ctx === ctx))
    );
  }

  once(event: string, fn: Handler, ctx?: unknown) {
    const wrap: Handler = (payload) => {
      this.off(event, wrap);
      fn.call(ctx, payload);
    };
    this.on(event, wrap);
  }

  emit(event: string, payload?: unknown) {
    const list = this.map.get(event);
    if (!list) return;
    for (const { fn, ctx } of [...list]) fn.call(ctx, payload);
  }
}

export const EventBus = new Emitter();
