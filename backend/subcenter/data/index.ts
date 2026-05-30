import fs from "fs";
import path from "path";

// Static imports as fallback
import entertainmentPresets from "./entertainment.json";
import musicPresets from "./music.json";
import aiPresets from "./ai.json";
import softwarePresets from "./software.json";
import otherPresets from "./other.json";

const staticPresets = [
  ...entertainmentPresets,
  ...musicPresets,
  ...aiPresets,
  ...softwarePresets,
  ...otherPresets
];

export function getPresetsData() {
  try {
    const files = ["entertainment.json", "music.json", "ai.json", "software.json", "other.json"];
    const merged: any[] = [];
    
    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        merged.push(...JSON.parse(content));
      } else {
        return staticPresets;
      }
    }
    return merged;
  } catch (err) {
    return staticPresets;
  }
}
