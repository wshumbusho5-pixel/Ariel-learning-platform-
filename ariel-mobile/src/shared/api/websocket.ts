type MessageHandler<T> = (message: T) => void;
type CleanupFn = () => void;

interface WebSocketManagerOptions {
  maxRetries?: number;
}

const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 4000];

export class BaseWebSocketManager<TIncoming = unknown, TOutgoing = unknown> {
  private socket: WebSocket | null = null;
  private url: string | null = null;
  private token: string | null = null;
  private handlers: Set<MessageHandler<TIncoming>> = new Set();
  private retryCount = 0;
  private maxRetries: number;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(options: WebSocketManagerOptions = {}) {
    this.maxRetries = options.maxRetries ?? DEFAULT_RETRY_DELAYS_MS.length;
  }

  connect(url: string, token?: string): void {
    this.url = url;
    this.token = token ?? null;
    this.intentionalClose = false;
    this.retryCount = 0;
    this._openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.retryTimeout !== null) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data: TOutgoing): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler<TIncoming>): CleanupFn {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private _buildUrl(): string {
    if (!this.url) return '';
    const sep = this.url.includes('?') ? '&' : '?';
    return this.token ? `${this.url}${sep}token=${encodeURIComponent(this.token)}` : this.url;
  }

  private _openSocket(): void {
    if (!this.url) return;

    try {
      this.socket = new WebSocket(this._buildUrl());
    } catch {
      this._scheduleRetry();
      return;
    }

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as TIncoming;
        this.handlers.forEach((h) => h(parsed));
      } catch {
        // Non-JSON message — ignore silently
      }
    };

    this.socket.onopen = () => {
      this.retryCount = 0;
    };

    this.socket.onclose = () => {
      if (!this.intentionalClose) {
        this._scheduleRetry();
      }
    };

    this.socket.onerror = () => {
      // onerror is always followed by onclose; retry handled there
    };
  }

  private _scheduleRetry(): void {
    if (this.retryCount >= this.maxRetries) return;
    const delay = DEFAULT_RETRY_DELAYS_MS[this.retryCount] ?? 4000;
    this.retryCount += 1;
    this.retryTimeout = setTimeout(() => {
      if (!this.intentionalClose) {
        this._openSocket();
      }
    }, delay);
  }
}
