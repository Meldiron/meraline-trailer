// Shows an image across the whole main screen, above every ordinary window and below Meraline's
// floating panel, so the panel's glass sees the film's own sky while a clip is recorded.
// Usage: backdrop <image.png>. Quits on SIGTERM.
import AppKit

let path = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: path), let screen = NSScreen.main else {
    FileHandle.standardError.write("Can't open \(path)\n".data(using: .utf8)!)
    exit(1)
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let window = NSWindow(contentRect: screen.frame, styleMask: .borderless, backing: .buffered, defer: false)
window.level = NSWindow.Level(rawValue: NSWindow.Level.floating.rawValue - 1)
window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
window.isOpaque = true
window.hasShadow = false
window.ignoresMouseEvents = true
let view = NSImageView(frame: NSRect(origin: .zero, size: screen.frame.size))
view.image = image
view.imageScaling = .scaleAxesIndependently
window.contentView = view
window.setFrame(screen.frame, display: true)
window.orderFrontRegardless()
signal(SIGTERM) { _ in exit(0) }
print("backdrop up")
fflush(stdout)
app.run()
