import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");
const configPath = path.join(__dirname, "..", "lib", "config.ts");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  try {
    let buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");
    let configContent = fs.readFileSync(configPath, "utf8");

    const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
    const versionNameMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);

    if (!versionCodeMatch || !versionNameMatch) {
      console.error("❌ Could not find version info in build.gradle");
      process.exit(1);
    }

    const currentVersionCode = parseInt(versionCodeMatch[1], 10);
    const currentVersionName = versionNameMatch[1];
    const newVersionCode = currentVersionCode + 1;

    console.log(`Current Version: ${currentVersionName} (Code: ${currentVersionCode})`);

    const parts = currentVersionName.split(".").map((val) => parseInt(val, 10));
    if (parts.length !== 3) {
      console.warn("⚠️ Version name format is not X.Y.Z, using manual entry only.");
    }

    let featureVersion = "";
    let fixVersion = "";

    if (parts.length === 3) {
      featureVersion = `${parts[0]}.${parts[1] + 1}.1`;
      fixVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }

    console.log("\nSelect version increment type:");
    if (fixVersion) console.log(`1) Fix (${fixVersion})`);
    if (featureVersion) console.log(`2) Feature (${featureVersion})`);
    console.log(`3) Manual entry`);
    console.log(`4) No change (Keep ${currentVersionName} - Code: ${currentVersionCode})`);

    const choice = await question("\nChoice (1-4): ");
    let newVersionName = "";
    let finalVersionCode = newVersionCode;

    if (choice === "1") {
      newVersionName = fixVersion;
    } else if (choice === "2") {
      newVersionName = featureVersion;
    } else if (choice === "4") {
      newVersionName = currentVersionName;
      finalVersionCode = currentVersionCode;
    } else {
      newVersionName = await question("Enter new version name (e.g. 0.7.0): ");
      if (newVersionName) {
        const customBuildNumber = await question(`Enter new build number (default: ${newVersionCode}): `);
        if (customBuildNumber.trim()) {
          const parsed = parseInt(customBuildNumber, 10);
          if (!isNaN(parsed)) {
            finalVersionCode = parsed;
          }
        }
      }
    }

    if (!newVersionName) {
      console.log("❌ Cancelled.");
      process.exit(0);
    }

    buildGradleContent = buildGradleContent.replace(/versionCode\s+\d+/, `versionCode ${finalVersionCode}`);
    buildGradleContent = buildGradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);
    fs.writeFileSync(buildGradlePath, buildGradleContent, "utf8");

    configContent = configContent.replace(/version:\s*"[^"]+"/, `version: "${newVersionName}"`);
    configContent = configContent.replace(/buildNumber:\s*\d+/, `buildNumber: ${finalVersionCode}`);
    fs.writeFileSync(configPath, configContent, "utf8");

    console.log(`\n✅ Successfully updated to ${newVersionName} (Code: ${finalVersionCode})`);
    console.log(`- Updated: android/app/build.gradle`);

    const iosProjectPath = path.join(__dirname, "..", "ios", "App", "App.xcodeproj", "project.pbxproj");
    if (fs.existsSync(iosProjectPath)) {
      let iosProjectContent = fs.readFileSync(iosProjectPath, "utf8");

      iosProjectContent = iosProjectContent.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${newVersionName};`);
      iosProjectContent = iosProjectContent.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${finalVersionCode};`);

      fs.writeFileSync(iosProjectPath, iosProjectContent, "utf8");
      console.log(`- Updated: ios/App/App.xcodeproj/project.pbxproj`);
    } else {
      console.warn(`⚠️ iOS project file not found at ${iosProjectPath}, skipping iOS update.`);
    }

    console.log(`- Updated: lib/config.ts`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
  }
}

main();
