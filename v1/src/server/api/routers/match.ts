import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { broadcastMatchUpdate } from "@/server/websocket/server";

// Helper function to advance winner to next round
async function advanceWinnerToNextRound(
  tournamentId: string,
  currentRound: number,
  currentPosition: number,
  winnerId: string,
) {
  // Find the next round match that this winner should advance to
  const nextRound = currentRound + 1;

  // In single elimination, position in next round is calculated as:
  // Math.ceil(currentPosition / 2)
  const nextPosition = Math.ceil(currentPosition / 2);

  // Find the next round match
  const nextMatch = await db.match.findFirst({
    where: {
      tournamentId: tournamentId,
      round: nextRound,
      position: nextPosition,
    },
  });

  if (nextMatch) {
    // Determine if winner goes to player1 or player2 slot
    // Odd positions (1, 3, 5...) go to player1, even positions (2, 4, 6...) go to player2
    const isPlayer1Slot = currentPosition % 2 === 1;

    await db.match.update({
      where: { id: nextMatch.id },
      data: isPlayer1Slot ? { player1Id: winnerId } : { player2Id: winnerId },
    });
  }
}

export const matchRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        round: z.number(),
        position: z.number(),
        player1Id: z.string().optional(),
        player2Id: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.match.create({
        data: {
          tournamentId: input.tournamentId,
          round: input.round,
          position: input.position,
          player1Id: input.player1Id,
          player2Id: input.player2Id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        player1Score: z.number().optional(),
        player2Score: z.number().optional(),
        winnerId: z.string().optional(),
        status: z
          .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "BYE"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const match = await db.match.update({
        where: { id: input.id },
        data: {
          player1Score: input.player1Score,
          player2Score: input.player2Score,
          winnerId: input.winnerId,
          status: input.status,
        },
      });

      // If match is completed and has a winner, advance to next round
      if (input.status === "COMPLETED" && input.winnerId) {
        await advanceWinnerToNextRound(
          match.tournamentId,
          match.round,
          match.position,
          input.winnerId,
        );
      }

      // Broadcast match update to WebSocket clients
      broadcastMatchUpdate(match);

      return match;
    }),

  advanceAllWinners: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      // Find all completed matches that have winners
      const completedMatches = await db.match.findMany({
        where: {
          tournamentId: input.tournamentId,
          status: "COMPLETED",
          winnerId: { not: null },
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      });

      // Advance each winner to the next round
      for (const match of completedMatches) {
        if (match.winnerId) {
          await advanceWinnerToNextRound(
            match.tournamentId,
            match.round,
            match.position,
            match.winnerId,
          );
        }
      }

      return {
        message: "All winners advanced",
        processedMatches: completedMatches.length,
      };
    }),

  getByTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      return await db.match.findMany({
        where: { tournamentId: input.tournamentId },
        include: {
          player1: true,
          player2: true,
          winner: true,
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      });
    }),
});
