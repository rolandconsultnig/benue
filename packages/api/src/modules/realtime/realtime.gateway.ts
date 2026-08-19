import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { RealtimeEmitter } from './realtime.events';

/**
 * Socket.IO gateway for live COP updates.
 *
 * Auth: clients send the JWT as a query param (?token=...) or via an
 * `authorization` event after connect. Operators join rooms per LGA.
 *
 * Emits:
 *   - incident.created / .updated / .dispatched
 *   - alert.changed
 *   - responder.moved
 *   - presence
 */
@WebSocketGateway({
  namespace: 'realtime',
  cors: { origin: (process.env.SOCKETIO_CORS_ORIGIN || 'http://localhost:5163').split(','), credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, RealtimeEmitter {
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly config: ConfigService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    // Token via query param (simplest for browser + React Native)
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token || typeof token !== 'string') {
      client.emit('error', { message: 'Missing auth token' });
      client.disconnect(true);
      return;
    }

    // Verify via the same JWT secret. Lightweight inline check; full user
    // resolution happens on the REST side. We trust the token signature here.
    try {
      // Lazy import to avoid circular dependency with AuthModule
      const { JwtService } = await import('@nestjs/jwt');
      // The JwtService is bound by AuthModule; for a minimal gateway we decode
      // inline using jsonwebtoken semantics via jwt.decode + verify on next tick.
      // For v1 we accept the connection if the token parses (signature verified
      // by the REST layer on every API call anyway).
      const payload = this.decodeToken(token);
      (client.data as any).userId = payload.sub;
      (client.data as any).role = payload.role;
      this.userSockets.set(payload.sub, (this.userSockets.get(payload.sub) ?? new Set()).add(client.id));
      this.broadcast('presence', { operatorId: payload.sub, online: true });
      this.logger.log(`⚡ Client connected: ${payload.sub} (${client.id})`);
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as any).userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      sockets?.delete(client.id);
      if (sockets && sockets.size === 0) {
        this.userSockets.delete(userId);
        this.broadcast('presence', { operatorId: userId, online: false });
      }
    }
  }

  // ─── Client messages ──────────────────────────────────────────────────────

  /** Client joins an LGA room to receive scoped incident events. */
  @SubscribeMessage('join:lga')
  handleJoinLga(@ConnectedSocket() client: Socket, @MessageBody() data: { lgaId: string }) {
    void client.join(`lga:${data.lgaId}`);
    client.emit('joined', { room: `lga:${data.lgaId}` });
  }

  @SubscribeMessage('join:situation-room')
  handleJoinSituationRoom(@ConnectedSocket() client: Socket) {
    void client.join('situation-room');
    client.emit('joined', { room: 'situation-room' });
  }

  /** Responder position update (from mobile or vehicle tracker). */
  @SubscribeMessage('responder:position')
  handleResponderPosition(@MessageBody() data: { responderId: string; lng: number; lat: number }) {
    // Re-broadcast to operators
    this.broadcast('responder.moved', { type: 'responder.moved', responderId: data.responderId, geo: { lng: data.lng, lat: data.lat } });
  }

  // ─── RealtimeEmitter impl (called by IncidentsService etc.) ───────────────

  emit(room: string, event: string, payload: unknown): void {
    this.server?.to(room).emit(event, payload);
  }

  broadcast(event: string, payload: unknown): void {
    this.server?.emit(event, payload);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private decodeToken(token: string): { sub: string; role: string } {
    // Verify JWT signature using the same secret as the REST API.
    // Falls back to decode-only if jsonwebtoken isn't available (dev mode).
    try {
      const jwt = require('jsonwebtoken');
      const secret = this.config.get<string>('JWT_ACCESS_SECRET', 'dev_access_secret_change_me');
      const payload = jwt.verify(token, secret) as any;
      return { sub: payload.sub, role: payload.role };
    } catch {
      throw new Error('Invalid or expired token');
    }
  }
}
