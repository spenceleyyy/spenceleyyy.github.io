Travel Buddy iOS Translate Plugin

1) Run `travel-buddy-ios-setup.command` or `npx cap add ios` to generate the iOS project.
2) Open the iOS project in Xcode (`npx cap open ios`).
3) Drag `native/ios/TravelBuddyTranslatePlugin.swift` into the `App` target.
4) If the plugin does not auto-register, add this line after the bridge is created:
   `bridge?.registerPluginInstance(TravelBuddyTranslatePlugin())`
5) Ensure your deployment target is iOS 17+ (Translate framework requirement).
6) On device, download language packs in Settings > Translate for offline use.
