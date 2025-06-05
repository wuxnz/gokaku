import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { broadcastMatchUpdate } from "@/server/websocket/server";

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

      // Broadcast match update to WebSocket clients
      broadcastMatchUpdate(match);

      return match;
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
