# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2025-11-04
### Added
- A new `Loader.JQ` object which is simply the [@lumjs/web-core]`/jq` sub-module.
  The `JQ.OPTS.{global,get}` properties can be customised if jQuery is not located
  in an eponymous global variable.
### Changed
- The `Loader.isJQ()` function is now an alias to the `JQ.isMatch()` function.
  It does exactly the same thing as the previous, but is more flexible and supports
  different ways of getting the jQuery class/function.

## [3.0.0] - 2024-03-15
### Changed
- Switched from [@lumjs/dom] to [@lumjs/web-core] for web features.

## [2.1.1] - 2023-01-25
### Fixed
- A couple error throwing bugs left over from the 2.x rewrite.

## [2.1.0] - 2023-01-06
### Changed
- Moved away from discontinued `ModuleBuilder`.

## [2.0.0] - 2022-10-21
### Changed
- Rewrote the whole thing.
- Broke it up into a modular codebase.
- Made it far more flexible.
- Removed unused and unfinished features.
- Changed the API a bit, thus bumping major version.

## [1.0.0] - 2022-08-04
### Added
- Initial release.

[Unreleased]: https://github.com/supernovus/lum.simple-loader.js/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/supernovus/lum.simple-loader.js/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/supernovus/lum.simple-loader.js/compare/v2.1.1...v3.0.0
[2.1.1]: https://github.com/supernovus/lum.simple-loader.js/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/supernovus/lum.simple-loader.js/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/supernovus/lum.simple-loader.js/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/supernovus/lum.simple-loader.js/releases/tag/v1.0.0

[@lumjs/web-core]: https://github.com/supernovus/lum.web-core.js

