import type { NextApiRequest, NextApiResponse } from 'next'

// Endpoint legado — use /api/groups/[id]/members
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  res.status(301).json({ message: `Endpoint descontinuado. Use /api/groups/${id}/members` })
}
