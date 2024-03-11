# Change Log

All notable changes to this project is documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.2.1]

This is a maintenance release that updates all third party developer dependencies to the latest version. This change should not affect the functionality of the module.

## [2.2.0]

Thanks to [@adi-miller](https://github.com/adi-miller) (#8):
- Trim decimal in percent view to 2 digits
- Added support for a reduced size view
- Added support for colorizing

## [2.1.1]

This is a maintenance release to modernize the development environment. There are no changes in the code of the module so these updates should not affect the functionality of the module.
- Get rid of Grunt, use native npm scripts instead to run the linters.
- Update all dependencies to the latest versions.

## [2.1.0]

- Allow stock change to be shown as percent - thanks to [Reese Wells](https://github.com/ducoterra).

## [2.0.1]

This is a maintenance release that updates all third party developer dependencies to the latest version and fix security vulnerability [CVE-2019-10744](https://github.com/lodash/lodash/pull/4336) in the third-party developer dependency `lodash` module.

This change should not affect the functionality of the module.

## [2.0.0]

- BREAKING CHANGE: From June 2019 IEX Group moved their free API to [IEX Cloud](https://iextrading.com/developer/). From version 2.0.0 this module supports only the IEX Cloud.

## [1.0.3]

- UPDATED: All devDependencies are updated to the latest version to fix potential security vulnerabilities in the developer tools.

## [1.0.2]

- FIXED: Eliminated `Uncaught TypeError: onCompleteCallback is not a function` console error during first data download.

## [1.0.1]

- FIXED: Not only the UI, but also the data source is requeried in the specified `updateInterval`.

## [1.0.0]

First public release.
