import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { Client as MinioClient } from 'minio';
import { randomUUID } from 'crypto';
import { MediaType, type CreateMediaAssetDto, type MediaAsset, type PresignedUpload } from '@cewers/shared';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly minio: MinioClient;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const useSsl = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    this.minio = new MinioClient({
      endPoint: this.config.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.config.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: useSsl,
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY', 'cewers_minio'),
      secretKey: this.config.get<string>('MINIO_SECRET_KEY', 'cewers_minio_secret'),
    });
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'cewers-media');
    this.endpoint = `${useSsl ? 'https' : 'http'}://${this.config.get<string>('MINIO_ENDPOINT', 'localhost')}:${this.config.get<string>('MINIO_PORT', '9000')}`;
  }

  async onModuleInit() {
    try {
      const exists = await this.minio.bucketExists(this.bucket);
      if (!exists) {
        await this.minio.makeBucket(this.bucket, 'us-east-1');
        this.logger.log(`Created bucket ${this.bucket}`);
      }
    } catch (err: any) {
      this.logger.warn(`MinIO unavailable (${err.message}); media uploads will fail until it is running.`);
    }
  }

  /** Create a media asset record and return a presigned PUT URL for direct upload. */
  async createPresignedUpload(dto: CreateMediaAssetDto): Promise<PresignedUpload> {
    const ext = this.extensionForMime(dto.mimeType) || 'bin';
    const id = randomUUID();
    const storageKey = `media/${id}.${ext}`;
    const expiresSeconds = 900; // 15 minutes

    const asset = await this.prisma.mediaAsset.create({
      data: {
        type: dto.type as any,
        storageKey,
        url: `${this.endpoint}/${this.bucket}/${storageKey}`,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        incidentId: null, // temporary; will be linked to incident
      },
    });

    if (dto.geo) {
      await this.prisma.setGeo('MediaAsset', asset.id, 'geo', dto.geo.lng, dto.geo.lat);
    }

    const url = await this.minio.presignedPutObject(this.bucket, storageKey, expiresSeconds);

    return {
      id: asset.id,
      storageKey,
      url,
      expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString(),
    };
  }

  /** Get asset metadata and a fresh presigned GET URL. */
  async findOne(id: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    return this.serialize(asset);
  }

  /** Get a presigned download URL for a media asset. */
  async getDownloadUrl(id: string): Promise<{ url: string; expiresAt: string }> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    const expiresSeconds = 3600; // 1 hour
    const url = await this.minio.presignedGetObject(this.bucket, asset.storageKey, expiresSeconds);
    return { url, expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString() };
  }

  /** List orphaned media assets (not yet linked to an incident). */
  async findOrphans(): Promise<MediaAsset[]> {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { incidentId: null },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(assets.map((a) => this.serialize(a)));
  }

  private async serialize(asset: any): Promise<MediaAsset> {
    const geo = await this.prisma.getGeo('MediaAsset', asset.id, 'geo');
    const { url } = await this.getDownloadUrl(asset.id);
    return {
      id: asset.id,
      type: asset.type,
      storageKey: asset.storageKey,
      url,
      geo,
      createdAt: asset.createdAt.toISOString(),
    };
  }

  private extensionForMime(mime: string): string | undefined {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/3gpp': '3gp',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
    };
    return map[mime.toLowerCase()];
  }
}
