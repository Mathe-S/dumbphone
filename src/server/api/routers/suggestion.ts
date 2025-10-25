import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { suggestions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const suggestionRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        drawingId: z.number(),
        visitorId: z.string().optional(),
        suggestion: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newSuggestion = await ctx.db
        .insert(suggestions)
        .values({
          drawingId: input.drawingId,
          visitorId: input.visitorId ?? null,
          suggestion: input.suggestion,
        })
        .returning();

      return newSuggestion[0];
    }),

  getByDrawingId: publicProcedure
    .input(z.object({ drawingId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(suggestions)
        .where(eq(suggestions.drawingId, input.drawingId))
        .orderBy(suggestions.createdAt);
    }),
});
