// Records part of the main screen to an H.264 movie at up to 60 frames a second, with the pointer,
// showing only the windows of the given processes: the backdrop and Meraline. The menu bar, the Dock,
// notifications, and every other app are left out whatever happens on screen.
//
// Usage: recorder <out.mp4> <x> <y> <width> <height> <pid,pid,...> <folder>
//   The region is in points from the screen's top-left. When the first frame is written, the recorder
//   writes its time (seconds since 1970) to <folder>/started; it stops when <folder>/stop appears.
import AVFoundation
import CoreMedia
import Foundation
import ScreenCaptureKit

let args = CommandLine.arguments
let out = URL(fileURLWithPath: args[1])
let region = CGRect(x: Double(args[2])!, y: Double(args[3])!, width: Double(args[4])!, height: Double(args[5])!)
let pids = Set(args[6].split(separator: ",").compactMap { pid_t($0) })
let folder = args[7]
let scale = 2.0
let pixelWidth = Int(region.width * scale) / 2 * 2
let pixelHeight = Int(region.height * scale) / 2 * 2

final class Writer: NSObject, SCStreamOutput {
    let writer: AVAssetWriter
    let input: AVAssetWriterInput
    let adaptor: AVAssetWriterInputPixelBufferAdaptor
    var started = false
    var frames = 0

    override init() {
        try? FileManager.default.removeItem(at: out)
        writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
        input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: pixelWidth,
            AVVideoHeightKey: pixelHeight,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 60_000_000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoExpectedSourceFrameRateKey: 60,
                AVVideoMaxKeyFrameIntervalKey: 60,
            ],
            AVVideoColorPropertiesKey: [
                AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
                AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
                AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
            ],
        ])
        input.expectsMediaDataInRealTime = true
        adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: nil)
        writer.add(input)
        super.init()
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer buffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .screen, let pixels = CMSampleBufferGetImageBuffer(buffer),
              let info = CMSampleBufferGetSampleAttachmentsArray(buffer, createIfNecessary: false) as? [[SCStreamFrameInfo: Any]],
              let raw = info.first?[.status] as? Int, SCFrameStatus(rawValue: raw) == .complete else { return }
        let time = CMSampleBufferGetPresentationTimeStamp(buffer)
        if !started {
            writer.startWriting()
            writer.startSession(atSourceTime: time)
            started = true
            try? String(Date().timeIntervalSince1970).write(toFile: "\(folder)/started", atomically: true, encoding: .utf8)
        }
        if input.isReadyForMoreMediaData {
            adaptor.append(pixels, withPresentationTime: time)
            frames += 1
        }
    }
}

let writer = Writer()
Task {
    let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: false)
    guard let display = content.displays.first(where: { $0.displayID == CGMainDisplayID() }) ?? content.displays.first else {
        print("no display"); exit(1)
    }
    let apps = content.applications.filter { pids.contains($0.processID) }
    guard apps.count == pids.count else { print("missing apps: found \(apps.map(\.processID)) of \(pids)"); exit(1) }
    let filter = SCContentFilter(display: display, including: apps, exceptingWindows: [])
    let config = SCStreamConfiguration()
    config.sourceRect = region
    config.width = pixelWidth
    config.height = pixelHeight
    config.minimumFrameInterval = CMTime(value: 1, timescale: 60)
    config.showsCursor = true
    config.queueDepth = 8
    config.pixelFormat = kCVPixelFormatType_32BGRA
    config.colorSpaceName = CGColorSpace.sRGB
    let stream = SCStream(filter: filter, configuration: config, delegate: nil)
    try stream.addStreamOutput(writer, type: .screen, sampleHandlerQueue: DispatchQueue(label: "frames"))
    try await stream.startCapture()
    print("recording \(pixelWidth)x\(pixelHeight)")
    fflush(stdout)
    while !FileManager.default.fileExists(atPath: "\(folder)/stop") {
        try await Task.sleep(for: .milliseconds(30))
    }
    try await stream.stopCapture()
    writer.input.markAsFinished()
    await writer.writer.finishWriting()
    print("wrote \(writer.frames) frames to \(out.path)")
    exit(writer.writer.status == .completed ? 0 : 1)
}
RunLoop.main.run()
