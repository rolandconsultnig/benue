/**
 * RealtimeService contract.
 *
 * Implemented by the RealtimeModule (Socket.IO gateway). Other modules
 * depend on this abstract to emit events without importing the gateway
 * directly (avoids circular deps). The RealtimeModule provides a concrete
 * impl bound to this symbol.
 */
export abstract class RealtimeEmitter {
  /** Emit to a room (an LGA id, or 'situation-room' for the global room). */
  abstract emit(room: string, event: string, payload: unknown): void;
  /** Emit to all connected operators (broadcast). */
  abstract broadcast(event: string, payload: unknown): void;
}

export const REALTIME_EMITTER = Symbol('REALTIME_EMITTER');
