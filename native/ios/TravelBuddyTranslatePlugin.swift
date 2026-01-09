import Foundation
import Capacitor
#if canImport(Translation)
import Translation
#endif

@objc(TravelBuddyTranslatePlugin)
public class TravelBuddyTranslatePlugin: CAPPlugin {
  @objc func translate(_ call: CAPPluginCall) {
    let text = call.getString("text") ?? ""
    if text.isEmpty {
      call.reject("Missing text")
      return
    }
    let source = call.getString("source")
    let target = call.getString("target") ?? "en"

    #if canImport(Translation)
    if #available(iOS 17.0, *) {
      Task {
        do {
          let translated = try await translateText(text, source: source, target: target)
          call.resolve(["text": translated])
        } catch {
          call.reject("Translate failed", error.localizedDescription)
        }
      }
      return
    }
    #endif

    call.reject("iOS Translate unavailable. Requires iOS 17+ with language pack downloaded.")
  }

  @available(iOS 17.0, *)
  private func translateText(_ text: String, source: String?, target: String) async throws -> String {
    #if canImport(Translation)
    let sourceCode = (source == nil || source == "auto" || source == "") ? nil : source
    let targetLanguage = Locale.Language(identifier: target)
    let sourceLanguage = sourceCode.map { Locale.Language(identifier: $0) }
    let configuration = TranslationSession.Configuration(source: sourceLanguage, target: targetLanguage)
    let session = TranslationSession(configuration: configuration)
    let response = try await session.translate(text)
    return response.targetText
    #else
    throw NSError(
      domain: "TravelBuddyTranslate",
      code: -1,
      userInfo: [NSLocalizedDescriptionKey: "Translation framework missing"]
    )
    #endif
  }
}
