import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as readline from "readline";
import { createReadStream, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");
const configPath = path.join(__dirname, "..", "lib", "config.ts");

type VersionMode = "fix" | "feature" | "no-change" | "manual" | "interactive";

type VersionChoice = {
  mode: VersionMode;
  version?: string;
  buildNumber?: number;
};

function parseArgs(argv: string[]): VersionChoice {
  if (argv.includes("--fix") || argv.includes("-f")) {
    return { mode: "fix" };
  }
  if (argv.includes("--feature")) {
    return { mode: "feature" };
  }
  if (argv.includes("--no-change") || argv.includes("-n")) {
    return { mode: "no-change" };
  }

  const versionIdx = argv.indexOf("--version");
  if (versionIdx >= 0 && argv[versionIdx + 1]) {
    const buildIdx = argv.indexOf("--build");
    const buildNumber =
      buildIdx >= 0 && argv[buildIdx + 1] ? parseInt(argv[buildIdx + 1], 10) : undefined;
    return {
      mode: "manual",
      version: argv[versionIdx + 1],
      buildNumber: buildNumber && !isNaN(buildNumber) ? buildNumber : undefined,
    };
  }

  return { mode: "interactive" };
}

function createPrompt() {
  const input =
    process.stdin.isTTY || !existsSync("/dev/tty")
      ? process.stdin
      : createReadStream("/dev/tty");

  return readline.createInterface({
    input,
    output: process.stdout,
    terminal: true,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function promptForChoice(
  fixVersion: string,
  featureVersion: string,
  currentVersionName: string,
  currentVersionCode: number
): Promise<VersionChoice> {
  const rl = createPrompt();

  try {
    console.log("\nSelect version increment type:");
    if (fixVersion) console.log(`1) Fix (${fixVersion})`);
    if (featureVersion) console.log(`2) Feature (${featureVersion})`);
    console.log(`3) Manual entry`);
    console.log(`4) No change (Keep ${currentVersionName} - Code: ${currentVersionCode})`);

    const choice = (await question(rl, "\nChoice (1-4): ")).trim();

    if (choice === "1") return { mode: "fix" };
    if (choice === "2") return { mode: "feature" };
    if (choice === "4") return { mode: "no-change" };

    const version = (await question(rl, "Enter new version name (e.g. 0.7.0): ")).trim();
    const customBuildNumber = (
      await question(rl, `Enter new build number (default: ${currentVersionCode + 1}): `)
    ).trim();

    const buildNumber = customBuildNumber ? parseInt(customBuildNumber, 10) : undefined;
    return {
      mode: "manual",
      version,
      buildNumber: buildNumber && !isNaN(buildNumber) ? buildNumber : undefined,
    };
  } finally {
    rl.close();
  }
}

function resolveVersionChoice(
  choice: VersionChoice,
  currentVersionName: string,
  currentVersionCode: number,
  fixVersion: string,
  featureVersion: string
) {
  const newVersionCode = currentVersionCode + 1;

  switch (choice.mode) {
    case "fix":
      return { newVersionName: fixVersion, finalVersionCode: newVersionCode };
    case "feature":
      return { newVersionName: featureVersion, finalVersionCode: newVersionCode };
    case "no-change":
      return { newVersionName: currentVersionName, finalVersionCode: currentVersionCode };
    case "manual":
      return {
        newVersionName: choice.version ?? "",
        finalVersionCode: choice.buildNumber ?? newVersionCode,
      };
    default:
      return { newVersionName: "", finalVersionCode: newVersionCode };
  }
}

export async function runIncrementVersion(argv: string[] = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`Usage: bun scripts/increment-version.ts [options]

Options:
  --fix, -f           Patch bump (1.4.4 -> 1.4.5)
  --feature           Minor bump (1.4.4 -> 1.5.1)
  --no-change, -n     Keep version, do not bump build number
  --version <name>    Set version manually (e.g. 1.4.5)
  --build <number>    Set build number manually (with --version)
`);
    return;
  }

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

  const parsed = parseArgs(argv);
  const choice =
    parsed.mode === "interactive"
      ? await promptForChoice(fixVersion, featureVersion, currentVersionName, currentVersionCode)
      : parsed;

  const { newVersionName, finalVersionCode } = resolveVersionChoice(
    choice,
    currentVersionName,
    currentVersionCode,
    fixVersion,
    featureVersion
  );

  if (!newVersionName) {
    console.log("❌ Cancelled.");
    process.exit(0);
  }

  buildGradleContent = buildGradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${finalVersionCode}`
  );
  buildGradleContent = buildGradleContent.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${newVersionName}"`
  );
  fs.writeFileSync(buildGradlePath, buildGradleContent, "utf8");

  configContent = configContent.replace(/version:\s*"[^"]+"/, `version: "${newVersionName}"`);
  configContent = configContent.replace(/buildNumber:\s*\d+/, `buildNumber: ${finalVersionCode}`);
  fs.writeFileSync(configPath, configContent, "utf8");

  console.log(`\n✅ Successfully updated to ${newVersionName} (Code: ${finalVersionCode})`);
  console.log(`- Updated: android/app/build.gradle`);

  const iosProjectPath = path.join(__dirname, "..", "ios", "App", "App.xcodeproj", "project.pbxproj");
  if (fs.existsSync(iosProjectPath)) {
    let iosProjectContent = fs.readFileSync(iosProjectPath, "utf8");

    iosProjectContent = iosProjectContent.replace(
      /MARKETING_VERSION = [^;]+;/g,
      `MARKETING_VERSION = ${newVersionName};`
    );
    iosProjectContent = iosProjectContent.replace(
      /CURRENT_PROJECT_VERSION = [^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${finalVersionCode};`
    );

    fs.writeFileSync(iosProjectPath, iosProjectContent, "utf8");
    console.log(`- Updated: ios/App/App.xcodeproj/project.pbxproj`);
  } else {
    console.warn(`⚠️ iOS project file not found at ${iosProjectPath}, skipping iOS update.`);
  }

  console.log(`- Updated: lib/config.ts`);
}

if ((import.meta as any).main) {
  runIncrementVersion().catch((error: Error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
}
