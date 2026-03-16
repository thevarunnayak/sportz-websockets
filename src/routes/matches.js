import {Router} from 'express';
import { matches } from '../db/schema.js';
import {db} from '../db/db.js';
import { getMatchStatus } from '../utils/match-status.js';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { desc, eq } from 'drizzle-orm';

export const matchRouter = Router();

// GET /matches - Get all matches
const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({error: 'Invalid query.', details: parsed.error.issues });
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(matches)
            .orderBy((desc(matches.createdAt)))
            .limit(limit)

        res.json({ data });
    } catch (e) {
        res.status(500).json({ error: 'Failed to list matches.' });
    }
})

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if(!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload.', details: parsed.error.issues });
    }

    const { data: { startTime, endTime, homeScore, awayScore } } = parsed;

    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        if(res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        }

        res.status(201).json({ data: event });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create match.'});
    }
})

/**
 * Update match score
 */
matchRouter.post("/:id/score", async (req, res) => {
  const matchId = Number(req.params.id);
  const { homeScore, awayScore } = req.body;

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return res.status(400).json({
      error: "Invalid score payload. Scores must be integers."
    });
  }

  try {
    const [updatedMatch] = await db
      .update(matches)
      .set({
        homeScore,
        awayScore
      })
      .where(eq(matches.id, matchId))
      .returning();

    if (!updatedMatch) {
      return res.status(404).json({
        error: "Match not found"
      });
    }

    /**
     * Broadcast score update to WebSocket clients
     */
    if (res.app.locals.broadcastScoreUpdate) {
      res.app.locals.broadcastScoreUpdate(matchId, {
        homeScore,
        awayScore
      });
    }

    return res.json({
      data: updatedMatch
    });
  } catch (error) {
    console.error("Failed to update score:", error);

    return res.status(500).json({
      error: "Failed to update score"
    });
  }
});