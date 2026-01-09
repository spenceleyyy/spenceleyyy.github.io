#!/bin/bash
set -e

echo "Travel Buddy iOS setup"
echo "-----------------------"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it from https://nodejs.org/, then run this again."
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Xcode not found. Install Xcode from the App Store, then run this again."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Syncing app/index.html..."
cp photo-translator.html app/index.html

if [ ! -d "ios" ]; then
  echo "Creating iOS project..."
  npx cap add ios
fi

echo "Copying web assets..."
npx cap copy ios

echo "Opening Xcode..."
npx cap open ios

echo ""
echo "Next steps in Xcode:"
echo "1) Set your bundle ID and signing team."
echo "2) Drag native/ios/TravelBuddyTranslatePlugin.swift into the App target for offline translation."
echo "3) Add NSCameraUsageDescription in Info.plist."
echo "4) Plug in your iPhone and click Run."
