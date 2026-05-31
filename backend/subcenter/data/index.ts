import fs from "fs";
import path from "path";

// Static imports as fallback
import entertainmentPresets from "./entertainment.json";
import musicPresets from "./music.json";
import aiPresets from "./ai.json";
import softwarePresets from "./software.json";
import designPresets from "./design.json";
import socialPresets from "./social.json";
import cloudPresets from "./cloud.json";
import datingPresets from "./dating.json";
import educationPresets from "./education.json";
import financePresets from "./finance.json";
import gamingPresets from "./gaming.json";
import productivityPresets from "./productivity.json";
import securityPresets from "./security.json";
import shoppingPresets from "./shopping.json";
import sportsPresets from "./sports.json";

const staticPresets = [
  ...entertainmentPresets,
  ...musicPresets,
  ...aiPresets,
  ...softwarePresets,
  ...designPresets,
  ...socialPresets,
  ...cloudPresets,
  ...datingPresets,
  ...educationPresets,
  ...financePresets,
  ...gamingPresets,
  ...productivityPresets,
  ...securityPresets,
  ...shoppingPresets,
  ...sportsPresets
];

export function getPresetsData() {
  try {
    const dataDir = __dirname;
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
    const merged: any[] = [];
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        merged.push(...JSON.parse(content));
      }
    }
    return merged;
  } catch (err) {
    return staticPresets;
  }
}
