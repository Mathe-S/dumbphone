/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
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
        // Handle different image input formats
        let imageInput = input.imageBase64;
        
        // If it's not a URL or data URI, convert to data URI
        if (!imageInput.startsWith("http") && !imageInput.startsWith("data:")) {
          imageInput = `data:image/png;base64,${imageInput}`;
        }

        const output = await replicate.run(
          "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
          {
            input: {
              task: "image_captioning",
              image: imageInput,
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
        })) as Array<{ url: () => string }> | string[];

        // Handle different response formats
        console.log("Seedream output:", output, "Type:", typeof output);
        
        let imageUrl = "";
        
        if (Array.isArray(output) && output.length > 0) {
          const first = output[0];
          console.log("First item type:", typeof first);
          
          if (typeof first === 'string') {
            imageUrl = first;
          } else if (first && typeof first === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj = first as any;
            if (typeof obj.url === 'function') {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
              imageUrl = obj.url();
            } else if (typeof obj.url === 'string') {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              imageUrl = obj.url;
            } else if (typeof obj.imageUrl === 'string') {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              imageUrl = obj.imageUrl;
            } else {
              imageUrl = JSON.stringify(obj);
            }
          } else {
            imageUrl = String(first);
          }
        } else if (typeof output === 'string') {
          imageUrl = output;
        } else {
          throw new Error("No image returned from Seedream");
        }

        console.log("Final imageUrl:", imageUrl);
        
        if (!imageUrl) {
          throw new Error("Empty image URL returned from Seedream");
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
