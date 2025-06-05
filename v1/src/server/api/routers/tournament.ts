import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tournamentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        size: z.number(),
        bracketType: z.string(),
        rules: z.string(),
        prize: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID is missing in session",
        });
      }

      // Ensure system user exists in database
      const { ensureSystemUser } = await import("../../ensureSystemUser");
      await ensureSystemUser();

      const tournament = await ctx.db.tournament.create({
        data: {
          ...input,
          organizerId: ctx.session.user.id,
          creatorId: ctx.session.user.id,
        },
      });
      return tournament;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tournament.findMany({
      include: {
        participants: true,
        organizer: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          organizer: true,
        },
      });
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      return tournament;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        size: z.number().optional(),
        bracketType: z.string().optional(),
        rules: z.string().optional(),
        prize: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
      });
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can update this tournament",
        });
      }
      return await ctx.db.tournament.update({
        where: { id: input.id },
        data: input,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
      });
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can delete this tournament",
        });
      }
      return await ctx.db.tournament.delete({
        where: { id: input.id },
      });
    }),

  join: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          participants: {
            connect: { id: ctx.session.user.id },
          },
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          participants: {
            disconnect: { id: ctx.session.user.id },
          },
        },
      });
    }),
});
