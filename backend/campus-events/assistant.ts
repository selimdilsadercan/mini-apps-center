import { api } from "encore.dev/api";
import { campus_events } from "~encore/clients";
import { requireString, optionalString } from "../lib/assistant-params";

export const execute_tool = api(
  { expose: false, method: "POST", path: "/campus-events/execute-tool" },
  async ({
    name,
    args,
  }: {
    name: string;
    args: Record<string, unknown>;
  }): Promise<{ result: string }> => {
    const userId = requireString(args, "userId");

    switch (name) {
      case "list_events": {
        const university = requireString(args, "university");
        const res = await campus_events.getEvents({ userId, university });
        return { result: JSON.stringify(res.events) };
      }
      case "add_event": {
        const title = requireString(args, "title");
        const university = requireString(args, "university");
        const eventDate = requireString(args, "eventDate");
        const description = optionalString(args, "description");
        const location = optionalString(args, "location");
        const imageUrl = optionalString(args, "imageUrl");
        const organizerClub = optionalString(args, "organizerClub");

        const res = await campus_events.addEvent({
          userId,
          title,
          university,
          eventDate,
          description,
          location,
          imageUrl,
          organizerClub,
        });
        return { result: JSON.stringify(res.event) };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
);
