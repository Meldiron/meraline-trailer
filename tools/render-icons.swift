// Renders each provider's icon the way Meraline's Settings draws it (an SF Symbol in white on a rounded
// square of the provider's tint), at 256 px, into public/providers/<id>.png for the montage.
// Symbols and tints are copied from Meraline/Providers/Provider.swift.
import AppKit

let providers: [(id: String, symbol: String, tint: NSColor)] = [
    ("apple", "apple.intelligence", NSColor(red: 0.44, green: 0.42, blue: 0.78, alpha: 1)),
    ("anthropic", "asterisk", NSColor(red: 0.85, green: 0.47, blue: 0.34, alpha: 1)),
    ("openAI", "circle.hexagongrid.fill", NSColor(red: 0.07, green: 0.64, blue: 0.50, alpha: 1)),
    ("gemini", "sparkle", NSColor(red: 0.26, green: 0.52, blue: 0.96, alpha: 1)),
    ("openRouter", "arrow.triangle.branch", NSColor(red: 0.42, green: 0.36, blue: 0.91, alpha: 1)),
    ("ollama", "desktopcomputer", NSColor(white: 0.35, alpha: 1)),
    ("custom", "server.rack", NSColor(red: 0.55, green: 0.56, blue: 0.60, alpha: 1)),
    ("claudeCode", "terminal.fill", NSColor(red: 0.80, green: 0.42, blue: 0.30, alpha: 1)),
    ("codex", "chevron.left.forwardslash.chevron.right", NSColor(red: 0.13, green: 0.13, blue: 0.15, alpha: 1)),
    ("opencode", "curlybraces", NSColor(red: 0.30, green: 0.33, blue: 0.40, alpha: 1)),
]

let size: CGFloat = 256
let folder = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "public/providers"
for p in providers {
    let image = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
        let square = NSBezierPath(roundedRect: rect.insetBy(dx: 8, dy: 8), xRadius: 58, yRadius: 58)
        let top = p.tint.blended(withFraction: 0.18, of: .white) ?? p.tint
        NSGradient(starting: top, ending: p.tint)?.draw(in: square, angle: -90)
        let config = NSImage.SymbolConfiguration(pointSize: 128, weight: .semibold)
            .applying(.init(paletteColors: [.white]))
        guard let symbol = NSImage(systemSymbolName: p.symbol, accessibilityDescription: nil)?.withSymbolConfiguration(config) else {
            print("no symbol \(p.symbol)"); return true
        }
        let s = symbol.size
        let fit = min(140 / s.width, 140 / s.height)
        let w = s.width * fit, h = s.height * fit
        symbol.draw(in: NSRect(x: (size - w) / 2, y: (size - h) / 2, width: w, height: h))
        return true
    }
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size), pixelsHigh: Int(size), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    image.draw(in: NSRect(x: 0, y: 0, width: size, height: size))
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(folder)/\(p.id).png"))
}
print("rendered \(providers.count) icons")
