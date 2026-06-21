#!/usr/bin/env node
/**
 * cap sync regenerates capacitor_pods with CapacitorFirebaseAuthentication (Lite only).
 * Google Sign-In requires the Google subspec + compile flag. Run after every cap sync.
 */
const fs = require("fs");
const path = require("path");

const podfilePath = path.join(__dirname, "../ios/App/Podfile");
let content = fs.readFileSync(podfilePath, "utf8");

const googlePodLine =
  "  pod 'CapacitorFirebaseAuthentication/Google', :path => '../../node_modules/@capacitor-firebase/authentication'";

if (!content.includes("CapacitorFirebaseAuthentication/Google")) {
  content = content.replace(
    /target 'App' do\n  capacitor_pods\n/,
    `target 'App' do\n  capacitor_pods\n  # Google Sign-In (do not put inside capacitor_pods — cap sync overwrites that block)\n${googlePodLine}\n`
  );
  console.log("[patch-ios-google-auth-podfile] Added CapacitorFirebaseAuthentication/Google pod");
}

const swiftFlagHook = `  installer.pods_project.targets.each do |target|
    if target.name == 'CapacitorFirebaseAuthentication'
      target.build_configurations.each do |config|
        flags = config.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
        flags = [flags].flatten.join(' ')
        unless flags.include?('RGCFA_INCLUDE_GOOGLE')
          config.build_settings['OTHER_SWIFT_FLAGS'] = "\#{flags} -DRGCFA_INCLUDE_GOOGLE"
        end
      end
    end
  end`;

if (!content.includes("RGCFA_INCLUDE_GOOGLE")) {
  content = content.replace(
    /post_install do \|installer\|\n  assertDeploymentTarget\(installer\)\n/,
    `post_install do |installer|\n  assertDeploymentTarget(installer)\n\n${swiftFlagHook}\n`
  );
  console.log("[patch-ios-google-auth-podfile] Added RGCFA_INCLUDE_GOOGLE compile flag");
}

fs.writeFileSync(podfilePath, content);

// Xcode bundles ios/App/GoogleService-Info.plist (not App/App/). Native Google Sign-In
// needs CLIENT_ID or signInWithGoogle hangs without resolving the plugin call.
const bundledPlistPath = path.join(__dirname, "../ios/App/GoogleService-Info.plist");
const appPlistPath = path.join(__dirname, "../ios/App/App/GoogleService-Info.plist");

function ensureGoogleServicePlistHasClientId(plistPath) {
  if (!fs.existsSync(plistPath)) return;

  const plist = fs.readFileSync(plistPath, "utf8");
  if (plist.includes("<key>CLIENT_ID</key>")) return;

  const sourcePath = fs.existsSync(appPlistPath) ? appPlistPath : bundledPlistPath;
  const source = fs.readFileSync(sourcePath, "utf8");
  const clientIdMatch = source.match(/<key>CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
  const reversedMatch = source.match(
    /<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/
  );

  if (!clientIdMatch) {
    console.warn("[patch-ios-google-auth-podfile] CLIENT_ID missing and no source to copy from");
    return;
  }

  const clientIdBlock = `\t<key>CLIENT_ID</key>\n\t<string>${clientIdMatch[1]}</string>\n`;
  const reversedBlock = reversedMatch
    ? `\t<key>REVERSED_CLIENT_ID</key>\n\t<string>${reversedMatch[1]}</string>\n`
    : "";

  const patched = plist.replace(
    "<dict>\n",
    `<dict>\n${clientIdBlock}${reversedBlock}`
  );

  fs.writeFileSync(plistPath, patched);
  console.log(`[patch-ios-google-auth-podfile] Added CLIENT_ID to ${path.basename(plistPath)}`);
}

ensureGoogleServicePlistHasClientId(bundledPlistPath);
ensureGoogleServicePlistHasClientId(appPlistPath);

// Sign in with Apple requires App.entitlements + CODE_SIGN_ENTITLEMENTS in Xcode project.
const entitlementsPath = path.join(__dirname, "../ios/App/App/App.entitlements");
const entitlementsTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.applesignin</key>
\t<array>
\t\t<string>Default</string>
\t</array>
</dict>
</plist>
`;

if (!fs.existsSync(entitlementsPath)) {
  fs.writeFileSync(entitlementsPath, entitlementsTemplate);
  console.log("[patch-ios-google-auth-podfile] Created App.entitlements");
} else if (!fs.readFileSync(entitlementsPath, "utf8").includes("com.apple.developer.applesignin")) {
  fs.writeFileSync(entitlementsPath, entitlementsTemplate);
  console.log("[patch-ios-google-auth-podfile] Restored Sign in with Apple entitlement");
}

const pbxprojPath = path.join(__dirname, "../ios/App/App.xcodeproj/project.pbxproj");
let pbxproj = fs.readFileSync(pbxprojPath, "utf8");

if (!pbxproj.includes("App.entitlements")) {
  pbxproj = pbxproj.replace(
    /504EC3131FED79650016851F \/\* Info.plist \*\/ = \{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; \};/,
    `504EC3131FED79650016851F /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };\n\t\tE7A1B2C32F192F6200E813A8 /* App.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = App.entitlements; sourceTree = "<group>"; };`
  );
  pbxproj = pbxproj.replace(
    /504EC3131FED79650016851F \/\* Info.plist \*\/,\n\t\t\t\t2FAD9762203C412B000D30F8 \/\* config.xml \*\/,/,
    `504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\tE7A1B2C32F192F6200E813A8 /* App.entitlements */,\n\t\t\t\t2FAD9762203C412B000D30F8 /* config.xml */,`
  );
  console.log("[patch-ios-google-auth-podfile] Added App.entitlements to Xcode project");
}

if (!pbxproj.includes("CODE_SIGN_ENTITLEMENTS")) {
  pbxproj = pbxproj.replace(
    /ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;/g,
    `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;`
  );
  console.log("[patch-ios-google-auth-podfile] Set CODE_SIGN_ENTITLEMENTS");
}

fs.writeFileSync(pbxprojPath, pbxproj);

console.log("[patch-ios-google-auth-podfile] Done");
