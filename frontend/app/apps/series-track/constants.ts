/** Kanal yayın slot saatleri (TR) */
export const CHANNEL_SLOT_TIMES = ["19:00", "21:00", "23:00"] as const;

export type ChannelSlotTime = (typeof CHANNEL_SLOT_TIMES)[number];

export function pickDefaultSlotTime(now = new Date()): ChannelSlotTime {
  const hour = now.getHours();
  let picked: ChannelSlotTime = "19:00";
  for (const slot of CHANNEL_SLOT_TIMES) {
    const slotHour = Number(slot.split(":")[0]);
    if (hour >= slotHour) picked = slot;
  }
  return picked;
}

type SlotProgram = {
  id: string;
  slot_time?: string | null;
  title?: string;
  cover_image?: string;
};

type SlotChannel = {
  active_program?: SlotProgram | null;
  slot_programs?: SlotProgram[] | string | null;
};

export function normalizeSlotTime(value?: string | null): string | null {
  if (value == null || value === "") return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function parseSlotPrograms(raw: SlotChannel["slot_programs"]): SlotProgram[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getChannelSlotPrograms<T extends SlotProgram>(channel: SlotChannel): T[] {
  const parsed = parseSlotPrograms(channel.slot_programs);
  const raw = parsed.length > 0 ? parsed : channel.active_program ? [channel.active_program] : [];

  return raw.map((program, index) => {
    const slotTime = normalizeSlotTime(program.slot_time);
    return {
      ...program,
      slot_time: slotTime ?? CHANNEL_SLOT_TIMES[index] ?? CHANNEL_SLOT_TIMES[0],
    } as T;
  });
}

export function getProgramForSlot<T extends SlotProgram>(
  channel: SlotChannel,
  slotTime: string,
): T | null {
  const target = normalizeSlotTime(slotTime) ?? slotTime;
  return getChannelSlotPrograms<T>(channel).find((p) => normalizeSlotTime(p.slot_time) === target) ?? null;
}
