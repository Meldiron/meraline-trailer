// Drives the app for a recording. The pointer glides like a hand moves it; keys go straight to one
// process (postToPid), so typing can never land in another app, whatever is in front.
//
//   input glide <x> <y> [seconds]          move the pointer there, easing in and out
//   input click <x> <y> [seconds]          glide there, then click
//   input type <pid> <text> [ms per key]   type text into that process; "\n" presses Return
//   input key <pid> <combo>                press a shortcut there: cmd+k, shift+cmd+n, return, escape…
//   input clipboard save|restore <file>    keep the clipboard, every kind on it, and put it back after
//   input clipboard set <text>             put text on the clipboard
//   input activate <pid>                   bring that app to the front, so a click reaches its window
//
// Points are in screen points from the top-left of the main screen.
import AppKit
import Carbon.HIToolbox
import CoreGraphics
import Foundation

let args = Array(CommandLine.arguments.dropFirst())
let source = CGEventSource(stateID: .hidSystemState)

func pointer() -> CGPoint { CGEvent(source: nil)?.location ?? .zero }

func glide(to target: CGPoint, seconds: Double) {
    let start = pointer()
    let steps = max(1, Int(seconds * 120))
    for i in 1...steps {
        let t = Double(i) / Double(steps)
        let e = t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2
        let p = CGPoint(x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e)
        CGEvent(mouseEventSource: source, mouseType: .mouseMoved, mouseCursorPosition: p, mouseButton: .left)?.post(tap: .cghidEventTap)
        usleep(useconds_t(1_000_000 / 120))
    }
}

func click(at p: CGPoint) {
    for type in [CGEventType.leftMouseDown, .leftMouseUp] {
        CGEvent(mouseEventSource: source, mouseType: type, mouseCursorPosition: p, mouseButton: .left)?.post(tap: .cghidEventTap)
        usleep(70_000)
    }
}

let keyCodes: [String: Int] = [
    "a": kVK_ANSI_A, "b": kVK_ANSI_B, "c": kVK_ANSI_C, "d": kVK_ANSI_D, "e": kVK_ANSI_E, "f": kVK_ANSI_F,
    "g": kVK_ANSI_G, "h": kVK_ANSI_H, "i": kVK_ANSI_I, "j": kVK_ANSI_J, "k": kVK_ANSI_K, "l": kVK_ANSI_L,
    "m": kVK_ANSI_M, "n": kVK_ANSI_N, "o": kVK_ANSI_O, "p": kVK_ANSI_P, "q": kVK_ANSI_Q, "r": kVK_ANSI_R,
    "s": kVK_ANSI_S, "t": kVK_ANSI_T, "u": kVK_ANSI_U, "v": kVK_ANSI_V, "w": kVK_ANSI_W, "x": kVK_ANSI_X,
    "y": kVK_ANSI_Y, "z": kVK_ANSI_Z, "1": kVK_ANSI_1, "2": kVK_ANSI_2, "3": kVK_ANSI_3,
    "return": kVK_Return, "escape": kVK_Escape, "tab": kVK_Tab, "space": kVK_Space, "delete": kVK_Delete,
    "down": kVK_DownArrow, "up": kVK_UpArrow, "left": kVK_LeftArrow, "right": kVK_RightArrow,
]

func press(_ pid: pid_t, code: Int, flags: CGEventFlags = [], text: String? = nil) {
    for down in [true, false] {
        guard let event = CGEvent(keyboardEventSource: source, virtualKey: CGKeyCode(code), keyDown: down) else { continue }
        event.flags = flags
        if let text {
            let units = Array(text.utf16)
            event.keyboardSetUnicodeString(stringLength: units.count, unicodeString: units)
        }
        event.postToPid(pid)
        usleep(down ? 18_000 : 4_000)
    }
}

switch args.first {
case "glide":
    glide(to: CGPoint(x: Double(args[1])!, y: Double(args[2])!), seconds: args.count > 3 ? Double(args[3])! : 0.7)
case "click":
    let p = CGPoint(x: Double(args[1])!, y: Double(args[2])!)
    glide(to: p, seconds: args.count > 3 ? Double(args[3])! : 0.7)
    usleep(120_000)
    click(at: p)
case "type":
    let pid = pid_t(args[1])!
    let perKey = args.count > 3 ? Double(args[3])! : 55
    for character in args[2].replacingOccurrences(of: "\\n", with: "\n") {
        if character == "\n" {
            press(pid, code: kVK_Return)
        } else {
            press(pid, code: kVK_ANSI_A, text: String(character))
        }
        let pause = " ,.?!".contains(character) ? perKey * 1.8 : perKey
        usleep(useconds_t((pause + Double.random(in: -perKey * 0.35...perKey * 0.35)) * 1000))
    }
case "key":
    let pid = pid_t(args[1])!
    var flags: CGEventFlags = []
    var code = -1
    for part in args[2].lowercased().split(separator: "+") {
        switch part {
        case "cmd": flags.insert(.maskCommand)
        case "shift": flags.insert(.maskShift)
        case "opt", "alt": flags.insert(.maskAlternate)
        case "ctrl": flags.insert(.maskControl)
        default: code = keyCodes[String(part)] ?? -1
        }
    }
    guard code >= 0 else { print("unknown key \(args[2])"); exit(1) }
    press(pid, code: code, flags: flags)
case "activate":
    NSRunningApplication(processIdentifier: pid_t(args[1])!)?.activate()
    usleep(150_000)
case "clipboard":
    let board = NSPasteboard.general
    switch args[1] {
    case "save":
        let items = (board.pasteboardItems ?? []).map { item in
            Dictionary(uniqueKeysWithValues: item.types.compactMap { type in item.data(forType: type).map { (type.rawValue, $0) } })
        }
        let data = try! PropertyListSerialization.data(fromPropertyList: items, format: .binary, options: 0)
        try! data.write(to: URL(fileURLWithPath: args[2]))
    case "restore":
        let data = try! Data(contentsOf: URL(fileURLWithPath: args[2]))
        let items = try! PropertyListSerialization.propertyList(from: data, format: nil) as! [[String: Data]]
        board.clearContents()
        board.writeObjects(items.map { entry in
            let item = NSPasteboardItem()
            for (type, value) in entry { item.setData(value, forType: NSPasteboard.PasteboardType(type)) }
            return item
        })
    case "set":
        board.clearContents()
        board.setString(args[2], forType: .string)
    default:
        exit(2)
    }
default:
    print("usage: input glide|click|type|key|clipboard …")
    exit(2)
}
