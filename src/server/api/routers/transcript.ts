import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import {
  getVideoInfo,
  getTranscript,
  YouTubeError,
  validateYtDlp
} from "~/server/utils/youtube";
import {
  generateSummary,
  checkOllamaAvailable,
  OllamaError,
  type SupportedLanguage
} from "~/server/utils/ollama";

export const transcriptRouter = createTRPCRouter({
  // Fetch transcript from YouTube URL
  fetchTranscript: publicProcedure
    .input(z.object({
      youtubeUrl: z.string().url()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate yt-dlp is available
        const isYtDlpAvailable = await validateYtDlp();
        if (!isYtDlpAvailable) {
          throw new Error("yt-dlp is not installed or not available in PATH. Please install yt-dlp to use this feature.");
        }

        // Get video info and transcript
        const [videoInfo, transcriptData] = await Promise.all([
          getVideoInfo(input.youtubeUrl),
          getTranscript(input.youtubeUrl)
        ]);

        // Save to database
        const savedTranscript = await ctx.db.transcript.create({
          data: {
            youtubeUrl: input.youtubeUrl,
            videoTitle: videoInfo.title,
            transcript: transcriptData.text,
            language: transcriptData.language || "en",
          },
        });

        return {
          id: savedTranscript.id,
          youtubeUrl: savedTranscript.youtubeUrl,
          videoTitle: savedTranscript.videoTitle,
          transcript: savedTranscript.transcript,
          language: savedTranscript.language,
          createdAt: savedTranscript.createdAt,
        };

      } catch (error) {
        if (error instanceof YouTubeError) {
          throw new Error(error.message);
        }

        if (error instanceof Error) {
          throw new Error(error.message);
        }

        throw new Error("Failed to fetch transcript from YouTube video");
      }
    }),

  // Get transcript history
  getHistory: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const transcripts = await ctx.db.transcript.findMany({
        take: input.limit,
        skip: input.offset,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          youtubeUrl: true,
          videoTitle: true,
          language: true,
          createdAt: true,
        },
      });

      const total = await ctx.db.transcript.count();

      return {
        transcripts,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get single transcript by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const transcript = await ctx.db.transcript.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!transcript) {
        throw new Error("Transcript not found");
      }

      return transcript;
    }),

  // Delete transcript
  delete: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.transcript.delete({
          where: {
            id: input.id,
          },
        });

        return { success: true };
      } catch {
        throw new Error("Failed to delete transcript or transcript not found");
      }
    }),

  // Check if yt-dlp is installed
  checkYtDlp: publicProcedure
    .query(async () => {
      const isAvailable = await validateYtDlp();
      return { isAvailable };
    }),

  // Check if Ollama is available
  checkOllama: publicProcedure
    .query(async () => {
      const isAvailable = await checkOllamaAvailable();
      return { isAvailable };
    }),

  // Generate AI summary of transcript
  generateSummary: publicProcedure
    .input(z.object({
      transcriptId: z.string(),
      language: z.enum(["en", "pl"]),
      style: z.enum(["concise", "detailed", "bullet-points"]).default("concise"),
      maxLength: z.number().min(100).max(1000).default(500),
      model: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the transcript
        const transcript = await ctx.db.transcript.findUnique({
          where: { id: input.transcriptId },
        });

        if (!transcript) {
          throw new Error("Transcript not found");
        }

        // Check if summary already exists
        const existingSummary = await ctx.db.transcriptSummary.findUnique({
          where: { transcriptId: input.transcriptId },
        });

        if (existingSummary) {
          return existingSummary;
        }

        // Generate new summary
        const summary = await generateSummary(transcript.transcript, {
          language: input.language as SupportedLanguage,
          style: input.style,
          maxLength: input.maxLength,
          model: input.model,
        });

        // Save summary to database
        const savedSummary = await ctx.db.transcriptSummary.create({
          data: {
            transcriptId: input.transcriptId,
            summary,
            model: input.model || "qwen2.5:14b",
          },
        });

        return savedSummary;

      } catch (error) {
        if (error instanceof OllamaError) {
          throw new Error(error.message);
        }
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error("Failed to generate summary");
      }
    }),

  // Get existing summary
  getSummary: publicProcedure
    .input(z.object({
      transcriptId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const summary = await ctx.db.transcriptSummary.findUnique({
        where: { transcriptId: input.transcriptId },
      });
      return summary;
    }),

  // Delete summary (to regenerate)
  deleteSummary: publicProcedure
    .input(z.object({
      transcriptId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.transcriptSummary.delete({
          where: { transcriptId: input.transcriptId },
        });
        return { success: true };
      } catch {
        throw new Error("Failed to delete summary or summary not found");
      }
    }),

});