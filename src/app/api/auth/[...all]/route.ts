import { toNextJsHandler } from 'better-auth/next-js';
import { betterAuthServer } from '@/core/auth';

export const { GET, POST } = toNextJsHandler(betterAuthServer);
