import type { NextApiRequest, NextApiResponse } from 'next'

// Endpoint legado — use /api/groups
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(301).json({ message: 'Endpoint descontinuado. Use /api/groups' })
}
