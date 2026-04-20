export type Listener<T> = (value: T) => void;

export class Store<T> {
  private current: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.current = initial;
  }

  get value(): T {
    return this.current;
  }

  set(next: T): void {
    if (next === this.current) return;
    this.current = next;
    for (const fn of this.listeners) fn(this.current);
  }

  update(partial: Partial<T>): void {
    this.set({ ...this.current, ...partial });
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  run(fn: Listener<T>): () => void {
    fn(this.current);
    return this.subscribe(fn);
  }
}
