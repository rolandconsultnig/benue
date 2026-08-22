import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaType } from '@cewers/shared';
import { Capability } from '@cewers/shared';
import type { MediaAsset, PresignedUpload } from '@cewers/shared';
import { MediaService } from './media.service';
import { CreateMediaAssetDto } from './dto/media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from '../../common/guards/capabilities.guard';
import { Capabilities } from '../../common/decorators/capabilities.decorator';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CapabilitiesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Create a media asset record and get a presigned PUT upload URL' })
  @Capabilities(Capability.UPLOAD_MEDIA)
  createPresignedUpload(@Body() dto: CreateMediaAssetDto): Promise<PresignedUpload> {
    return this.media.createPresignedUpload(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List unlinked (orphan) media assets pending attachment' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findOrphans(): Promise<MediaAsset[]> {
    return this.media.findOrphans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media asset metadata and a fresh download URL' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findOne(@Param('id') id: string): Promise<MediaAsset> {
    return this.media.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get a presigned download URL for a media asset' })
  @Capabilities(Capability.VIEW_COP_MAP)
  getDownloadUrl(@Param('id') id: string): Promise<{ url: string; expiresAt: string }> {
    return this.media.getDownloadUrl(id);
  }
}
