import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VimeoUploadResponse {
  uri:        string;   // e.g. /videos/123456789
  videoId:    string;
  embedUrl:   string;
  uploadUrl:  string;   // tus upload URL
}

@Injectable()
export class VimeoService {
  private readonly logger = new Logger(VimeoService.name);
  private readonly accessToken: string;
  private readonly apiBase = 'https://api.vimeo.com';

  constructor(configService: ConfigService) {
    this.accessToken = configService.getOrThrow<string>('vimeo.accessToken');
  }

  /**
   * Creates a Vimeo video upload slot using the tus resumable upload approach.
   * Returns the upload URL for the client to push the video bytes to directly.
   * The video will be private by default (accessible only via embed).
   */
  async createUploadSlot(params: {
    name:          string;
    description?:  string;
    fileSizeBytes: number;
  }): Promise<VimeoUploadResponse> {
    const response = await fetch(`${this.apiBase}/me/videos`, {
      method: 'POST',
      headers: {
        Authorization:  `bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept:         'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({
        upload: {
          approach: 'tus',
          size:     params.fileSizeBytes,
        },
        name:        params.name,
        description: params.description,
        privacy:     { view: 'disable' }, // Private — only embeddable
        embed:       { buttons: { like: false, watchlater: false, share: false }, title: { name: 'hide' } },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error('Vimeo create slot failed', err);
      throw new InternalServerErrorException('Failed to create Vimeo upload slot');
    }

    const data = await response.json() as {
      uri:    string;
      upload: { upload_link: string };
    };

    const videoId  = data.uri.replace('/videos/', '');
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;

    this.logger.log(`Vimeo upload slot created: video ID ${videoId}`);
    return {
      uri:       data.uri,
      videoId,
      embedUrl,
      uploadUrl: data.upload.upload_link,
    };
  }

  /**
   * Sets video privacy to "anybody" after upload is complete and passes admin review.
   * Until this is called, the video is only accessible via embed token.
   */
  async publishVideo(videoId: string): Promise<void> {
    const response = await fetch(`${this.apiBase}/videos/${videoId}`, {
      method: 'PATCH',
      headers: {
        Authorization:  `bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept:         'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({ privacy: { view: 'anybody' } }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to publish Vimeo video');
    }
    this.logger.log(`Vimeo video published: ${videoId}`);
  }

  /**
   * Deletes a Vimeo video (called when a lesson resource is removed).
   */
  async deleteVideo(videoId: string): Promise<void> {
    await fetch(`${this.apiBase}/videos/${videoId}`, {
      method:  'DELETE',
      headers: { Authorization: `bearer ${this.accessToken}` },
    });
    this.logger.log(`Vimeo video deleted: ${videoId}`);
  }

  /**
   * Gets video status — useful to check if Vimeo has finished transcoding.
   */
  async getVideoStatus(videoId: string): Promise<{ status: string; duration: number | null }> {
    const response = await fetch(`${this.apiBase}/videos/${videoId}?fields=status,duration`, {
      headers: {
        Authorization: `bearer ${this.accessToken}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to fetch Vimeo video status');
    }

    const data = await response.json() as { status: string; duration: number | null };
    return { status: data.status, duration: data.duration };
  }
}
