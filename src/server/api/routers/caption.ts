import { z } from "zod";
import Replicate from "replicate";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const captionRouter = createTRPCRouter({
  generateFromBase64: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Convert base64 to data URI if not already
        const dataUri = input.imageBase64.startsWith("data:")
          ? input.imageBase64
          : `data:image/png;base64,${input.imageBase64}`;

        const output = await replicate.run(
          "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
          {
            input: {
              task: "image_captioning",
              image: dataUri,
            },
          },
        );

        // BLIP returns a string directly
        const caption =
          typeof output === "string" ? output : JSON.stringify(output);

        return {
          caption,
        };
      } catch (error) {
        console.error("Caption generation error:", error);
        throw new Error(
          `Failed to generate caption: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  generateImageFromCaption: publicProcedure
    .input(
      z.object({
        caption: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const output = (await replicate.run("bytedance/seedream-4", {
          input: {
            size: "1K",
            width: 1024,
            height: 1024,
            prompt: input.caption,
            max_images: 1,
            image_input: [],
            aspect_ratio: "4:3",
            enhance_prompt: true,
            sequential_image_generation: "disabled",
          },
        })) as Array<{ url: () => string }>;

        const imageUrl = output[0]?.url();

        if (!imageUrl) {
          throw new Error("No image URL returned from Seedream");
        }

        return {
          imageUrl,
        };
      } catch (error) {
        console.error("Image generation error:", error);
        throw new Error(
          `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),
});
