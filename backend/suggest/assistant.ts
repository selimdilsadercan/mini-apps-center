import { suggest } from "~encore/clients";
import { requireString, optionalString, requireNumber, optionalNumber } from "../lib/assistant-params";

export const tools: Record<string, any> = {
  get_inbox_suggestions: {
    description: "Get all song, movie, series, video, book or place suggestions sent to the current user (Inbox)",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The Clerk ID of the current user" }
      },
      required: ["userId"]
    },
    execute: async (args: Record<string, unknown>) => {
      const userId = requireString(args, "userId");
      const res = await suggest.getInbox({ userId });
      return res.suggestions;
    }
  },

  get_sent_suggestions: {
    description: "Get all suggestions sent by the current user along with their recipient statuses (Sent)",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The Clerk ID of the current user" }
      },
      required: ["userId"]
    },
    execute: async (args: Record<string, unknown>) => {
      const userId = requireString(args, "userId");
      const res = await suggest.getSent({ userId });
      return res.suggestions;
    }
  },

  create_suggestion: {
    description: "Send a new recommendation of a song, movie, show, video, book, or venue to one or more friends.",
    parameters: {
      type: "object",
      properties: {
        senderClerkId: { type: "string", description: "Clerk ID of the sender user" },
        category: { type: "string", enum: ["song", "movie", "tv", "video", "place", "book"], description: "Category of suggestion" },
        title: { type: "string", description: "Title of the item being recommended" },
        shortNote: { type: "string", description: "Short descriptive note or recommendation comment" },
        rating: { type: "number", description: "Rating score from 0 to 5" },
        externalLink: { type: "string", description: "Optional web link or address (e.g. IMDb, Google Maps)" },
        imageUrl: { type: "string", description: "Optional banner or image link" },
        recipientClerkIds: {
          type: "array",
          items: { type: "string" },
          description: "Clerk IDs of recipient friends"
        }
      },
      required: ["senderClerkId", "category", "title", "recipientClerkIds"]
    },
    execute: async (args: Record<string, unknown>) => {
      const senderClerkId = requireString(args, "senderClerkId");
      const category = requireString(args, "category") as any;
      const title = requireString(args, "title");
      const shortNote = optionalString(args, "shortNote") ?? undefined;
      const rating = optionalNumber(args, "rating") ?? undefined;
      const externalLink = optionalString(args, "externalLink") ?? undefined;
      const imageUrl = optionalString(args, "imageUrl") ?? undefined;
      
      const recipientClerkIdsRaw = args["recipientClerkIds"];
      if (!Array.isArray(recipientClerkIdsRaw)) {
        throw new Error("recipientClerkIds must be an array of strings");
      }
      const recipientClerkIds = recipientClerkIdsRaw.map(x => String(x));

      const res = await suggest.createSuggestion({
        senderClerkId,
        category,
        title,
        shortNote,
        rating,
        externalLink,
        imageUrl,
        recipientClerkIds
      });
      return res;
    }
  }
};
