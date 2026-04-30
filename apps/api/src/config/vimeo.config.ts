import { registerAs } from '@nestjs/config';

export default registerAs('vimeo', () => ({
  accessToken:  process.env.VIMEO_ACCESS_TOKEN,
  clientId:     process.env.VIMEO_CLIENT_ID,
  clientSecret: process.env.VIMEO_CLIENT_SECRET,
}));
