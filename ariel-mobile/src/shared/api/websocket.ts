type MessageHandler<T> = (message: T) => void;
type CleanupFn = () => void;

interface WebSocketManagerOptions {
  maxRetries?: number;
}

/** Lifecycle callbacks exposed to callers (e.g. React hooks). */
export interface WebSocketLifecycleCallbacks {
  /** Fired when the socket successfully opens (or re-opens after a retry). */
  onOpen?: () => void;
  /**
   * Fired when the socket closes unexpectedly and a reconnect attempt is
   * about to be scheduled.  `attempt` is 1-based and `maxAttempts` is the
   * configured limit.
   */
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
  /**
   * Fired when all retry attempts have been exhausted and we give up.
   */
  onGiveUp?: () => void;
  /** Fired when an intentional disconnect occurs. */
  onDisconnected?: () => void;
}

// Exponential backoff: 1 s, 2 s, 4 s, 8 s, 16 s (capped at maxRetries entries)
function backoffDelay(attempt: number): number {
  return 1000 * Math.pow(2, attempt);
}

const DEFAULT_MAX_RETRIES = 5;

export class BaseWebSocketManager<TIncoming = unknown, TOutgoing = unknown> {
  private socket: WebSocket | null = null;
  private url: string | null = null;
  private token: string | null = null;
  private handlers: Set<MessageHandler<TIncoming>> = new Set();
  private retryCount = 0;
  private maxRetries: number;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  /** Optional lifecycle callbacks set by the hook layer. */
  lifecycleCallbacks: WebSocketLifecycleCallbacks = {};

  constructor(options: WebSocketManagerOptions = {}) {
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
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
    this.lifecycleCallbacks.onDisconnected?.();
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
      this.lifecycleCallbacks.onOpen?.();
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
    if (this.retryCount >= this.maxRetries) {
      this.lifecycleCallbacks.onGiveUp?.();
      return;
    }
    const attempt = this.retryCount; // 0-based index used for delay calculation
    this.retryCount += 1;
    this.lifecycleCallbacks.onReconnecting?.(this.retryCount, this.maxRetries);
    const delay = backoffDelay(attempt); // 1 s, 2 s, 4 s, 8 s, 16 s
    this.retryTimeout = setTimeout(() => {
      if (!this.intentionalClose) {
        this._openSocket();
      }
    }, delay);
  }
}
