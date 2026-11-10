import UIKit
import WebKit

private final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?

    init(delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}

final class PinoutViewController: UIViewController {
    static let appBackground = UIColor(red: 11.0 / 255.0, green: 13.0 / 255.0, blue: 18.0 / 255.0, alpha: 1.0)
    private static let allowedStorageKeys: Set<String> = [
        "ls_swap_config_v2",
        "ls_swap_pinout_progress_v1"
    ]

    private var webView: WKWebView!
    private let lightHaptic = UIImpactFeedbackGenerator(style: .light)
    private let mediumHaptic = UIImpactFeedbackGenerator(style: .medium)

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .lightContent
    }

    override var prefersHomeIndicatorAutoHidden: Bool {
        false
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        overrideUserInterfaceStyle = .dark
        view.backgroundColor = Self.appBackground

        lightHaptic.prepare()
        mediumHaptic.prepare()

        setupWebView()
        setupEdgeBackSwipe()
        loadEmbeddedPinoutApp()
    }

    private func setupWebView() {
        let contentController = WKUserContentController()
        contentController.add(WeakScriptMessageHandler(delegate: self), name: "iOSBridge")

        if let hydrationScript = buildStorageHydrationScript() {
            let userScript = WKUserScript(
                source: hydrationScript,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            contentController.addUserScript(userScript)
        }

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.websiteDataStore = .default()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = false

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = Self.appBackground
        webView.scrollView.backgroundColor = Self.appBackground
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.allowsBackForwardNavigationGestures = false

        if #available(iOS 16.4, *) {
            #if DEBUG
            webView.isInspectable = true
            #endif
        }

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
    }

    private func setupEdgeBackSwipe() {
        let edgeSwipe = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleLeftEdgePan(_:)))
        edgeSwipe.edges = .left
        view.addGestureRecognizer(edgeSwipe)
    }

    @objc private func handleLeftEdgePan(_ recognizer: UIScreenEdgePanGestureRecognizer) {
        guard recognizer.state == .recognized else { return }
        webView.evaluateJavaScript("if (window.handleAndroidBack) { window.handleAndroidBack(); }", completionHandler: nil)
    }

    private func buildStorageHydrationScript() -> String? {
        var pairs: [String: String] = [:]
        for key in Self.allowedStorageKeys {
            if let saved = UserDefaults.standard.string(forKey: "pinout_backup_\(key)") {
                pairs[key] = saved
            }
        }
        guard !pairs.isEmpty,
              let jsonData = try? JSONSerialization.data(withJSONObject: pairs, options: []),
              let jsonLiteral = String(data: jsonData, encoding: .utf8) else {
            return nil
        }

        return """
        (function() {
            try {
                var backup = \(jsonLiteral);
                Object.keys(backup).forEach(function(k) {
                    if (!localStorage.getItem(k) && backup[k]) {
                        localStorage.setItem(k, backup[k]);
                    }
                });
            } catch (e) {}
        })();
        """
    }

    private func loadEmbeddedPinoutApp() {
        let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp")
            ?? Bundle.main.url(forResource: "index", withExtension: "html")

        guard let htmlURL = url else {
            let fallbackHTML = """
            <html><body style="background:#0B0D12;color:#F8FAFC;font-family:-apple-system;padding:40px;text-align:center;">
            <h2>Missing Offline Pinout Bundle</h2><p>Run python3 build.py to generate index.html.</p>
            </body></html>
            """
            webView.loadHTMLString(fallbackHTML, baseURL: nil)
            return
        }

        webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    }

    private func exportHarnessProgress(title: String, filename: String, content: String) {
        let safeFilename = filename.isEmpty ? "LS_Swap_Harness_Progress.json" : (filename as NSString).lastPathComponent
        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(safeFilename)

        let itemsToShare: [Any]
        if let data = content.data(using: .utf8), (try? data.write(to: fileURL, options: .atomic)) != nil {
            itemsToShare = [fileURL]
        } else {
            itemsToShare = [content]
        }

        let activityVC = UIActivityViewController(activityItems: itemsToShare, applicationActivities: nil)
        activityVC.setValue(title, forKey: "subject")
        activityVC.overrideUserInterfaceStyle = .dark

        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            popover.permittedArrowDirections = []
        }

        present(activityVC, animated: true)
    }
}

extension PinoutViewController: WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "iOSBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }

        switch action {
        case "hapticTap":
            let style = (body["style"] as? String) ?? "light"
            if style == "medium" {
                mediumHaptic.impactOccurred()
                mediumHaptic.prepare()
            } else {
                lightHaptic.impactOccurred()
                lightHaptic.prepare()
            }

        case "syncStorage":
            if let key = body["key"] as? String,
               Self.allowedStorageKeys.contains(key),
               let value = body["value"] as? String {
                UserDefaults.standard.set(value, forKey: "pinout_backup_\(key)")
            }

        case "shareFile":
            let title = (body["title"] as? String) ?? "LS Swap Harness Progress"
            let filename = (body["filename"] as? String) ?? "LS_Swap_Harness_Progress.json"
            let content = (body["content"] as? String) ?? "{}"
            exportHarnessProgress(title: title, filename: filename, content: content)

        default:
            break
        }
    }
}

extension PinoutViewController: WKNavigationDelegate {
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        if url.isFileURL || url.scheme == "about" || url.scheme == "blob" || url.scheme == "data" {
            decisionHandler(.allow)
            return
        }

        UIApplication.shared.open(url, options: [:], completionHandler: nil)
        decisionHandler(.cancel)
    }
}

extension PinoutViewController: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        let alert = UIAlertController(title: "LS Pinout Pro", message: message, preferredStyle: .alert)
        alert.overrideUserInterfaceStyle = .dark
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler()
        })
        present(alert, animated: true)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        let alert = UIAlertController(title: "LS Pinout Pro", message: message, preferredStyle: .alert)
        alert.overrideUserInterfaceStyle = .dark
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
            completionHandler(false)
        })
        alert.addAction(UIAlertAction(title: "Reset", style: .destructive) { _ in
            completionHandler(true)
        })
        present(alert, animated: true)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        let alert = UIAlertController(title: "LS Pinout Pro", message: prompt, preferredStyle: .alert)
        alert.overrideUserInterfaceStyle = .dark
        alert.addTextField { textField in
            textField.text = defaultText
        }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
            completionHandler(nil)
        })
        alert.addAction(UIAlertAction(title: "Save", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text)
        })
        present(alert, animated: true)
    }
}
