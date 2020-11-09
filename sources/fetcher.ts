import { CwdFS, Filename, LazyFS, NodeFS, PortablePath, ZipFS, ppath, xfs } from '@yarnpkg/fslib'
import { FetchOptions, Fetcher, Locator, MinimalFetchOptions, miscUtils, structUtils } from '@yarnpkg/core'

import { getLibzipPromise } from '@yarnpkg/libzip'

export class AppBuilderFetcher implements Fetcher {
  supports(locator: Locator, opts: MinimalFetchOptions) {
    if (!locator.reference.startsWith(`appbuilder:`)) return false

    return true
  }

  getLocalPath(locator: Locator, opts: FetchOptions) {
    return null
  }

  async fetch(locator: Locator, opts: FetchOptions) {
    const baseFs = new NodeFS()

    const { zipPackage } = await this.fetchPrebuild(locator, opts)
    const originalPath = zipPackage.getRealPath()

    await xfs.chmodPromise(originalPath, 0o644)

    // This file will be overwritten later, it's cache key just needs to be constant per locator
    const checksum = `${opts.cache.cacheKey}/${locator.locatorHash}`

    const cachePath = opts.cache.getLocatorPath(locator, checksum)

    // Add the cache path to the marked files list so that the zips aren't removed
    opts.cache.markedFiles.add(cachePath)

    if (!cachePath) throw new Error(`Assertion failed: Expected the cache path to be available`)

    await xfs.mkdirpPromise(ppath.dirname(cachePath))
    await xfs.movePromise(originalPath, cachePath)

    let readOnlyZipFs: ZipFS | null = null

    const libzip = await getLibzipPromise()
    const lazyFs: LazyFS<PortablePath> = new LazyFS<PortablePath>(
      () =>
        miscUtils.prettifySyncErrors(
          () => {
            return (readOnlyZipFs = new ZipFS(cachePath, { baseFs, libzip, readOnly: true }))
          },
          message => {
            return `Failed to open the cache entry for ${structUtils.prettyLocator(
              opts.project.configuration,
              locator,
            )}: ${message}`
          },
        ),
      ppath,
    )

    const releaseFs = () => {
      if (readOnlyZipFs !== null) {
        readOnlyZipFs.discardAndClose()
      }
    }

    return {
      packageFs: lazyFs,
      releaseFs,
      prefixPath: structUtils.getIdentVendorPath(locator),
      localPath: this.getLocalPath(locator, opts),
      checksum,
    }
  }

  private async fetchPrebuild(locator: Locator, opts: FetchOptions) {
    const tmpDir = await xfs.mktempPromise()
    const tmpFile = ppath.join(tmpDir, `prebuilt.zip` as Filename)
    const prefixPath = structUtils.getIdentVendorPath(locator)

    const zipPackage = new ZipFS(tmpFile, { libzip: await getLibzipPromise(), create: true })
    await zipPackage.mkdirpPromise(prefixPath)

    const generatedPackage = new CwdFS(prefixPath, { baseFs: zipPackage })

    // Write our package.json
    await generatedPackage.writeJsonPromise(`package.json` as Filename, {
      name: structUtils.slugifyLocator(locator),
      preferUnplugged: true, // Tell yarn to unplug the bindings package
    })

    zipPackage.saveAndClose()

    return {
      zipPackage,
    }
  }
}
