// swift-tools-version: 5.9

import PackageDescription

let package = Package(
  name: "TerajsRendererHost",
  platforms: [
    .iOS(.v15)
  ],
  products: [
    .library(
      name: "TerajsRendererHost",
      targets: ["TerajsRendererHost"]
    )
  ],
  targets: [
    .target(
      name: "TerajsRendererHost",
      path: "Sources/TerajsRendererHost"
    )
  ]
)