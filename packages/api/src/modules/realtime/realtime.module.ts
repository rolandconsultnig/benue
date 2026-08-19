import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { REALTIME_EMITTER } from './realtime.events';

/**
 * RealtimeModule — provides the Socket.IO gateway bound to the
 * RealtimeEmitter abstract, so other modules can emit events via
 * `@Inject(REALTIME_EMITTER)`.
 */
@Module({
  providers: [
    RealtimeGateway,
    { provide: REALTIME_EMITTER, useExisting: RealtimeGateway },
  ],
  exports: [REALTIME_EMITTER, RealtimeGateway],
})
export class RealtimeModule {}
