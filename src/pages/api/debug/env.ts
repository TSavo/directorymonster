import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URL: process.env.REDIS_URL ? 'DEFINED' : 'UNDEFINED',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'DEFINED' : 'UNDEFINED',
    HOSTNAME: process.env.HOSTNAME,
    PORT: process.env.PORT,
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    RUNTIME: process.env.NEXT_RUNTIME
  });
}
