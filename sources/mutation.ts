import { CwdFS, Filename, PortablePath } from '@yarnpkg/fslib'
import {
  FetchResult,
  Locator,
  MessageName,
  MultiFetcher,
  Package,
  Project,
  StreamReport,
  miscUtils,
  structUtils,
} from '@yarnpkg/core'
import { normalisedArch, walk } from './utils'
import { ZipOpenFS } from '@yarnpkg/libzip'

import { InstallOptions } from '@yarnpkg/core/lib/Project'
import { PassThrough } from 'stream'
import { getLibzipPromise } from '@yarnpkg/libzip'
import { ppath } from '@yarnpkg/fslib'
import { constants as fsConstants } from 'fs'

function runTemplate(template: string, templateValues: { [key: string]: string }) {
  for (const [key, value] of Object.entries(templateValues))
    template = template.replace(new RegExp(`{${key}}`, `g`), value)

  return template
}

const cacheVersion = `1`

async function cacheMatch(
  packageFs: CwdFS,
  cacheKeyLocation: PortablePath,
  packageLocation: PortablePath,
  cacheHashEntropy: string,
) {
  if (await packageFs.existsPromise(cacheKeyLocation)) {
    const cacheKey = (await packageFs.readFilePromise(cacheKeyLocation)).toString()

    // Check the executable exists and it has executable file permissions.
    // Sanity check that the executable exists
    const executableLocation = ppath.join(
      packageLocation,
      `bin` as Filename,
      (process.platform === `win32` ? `app-builder.exe` : `app-builder`) as Filename,
    )

    // No executable means the cache is dirty
    if (!(await packageFs.existsPromise(executableLocation))) {
      return false
    }

    // Check if the executable is executable
    let canExecute = false

    await packageFs
      .accessPromise(executableLocation, fsConstants.X_OK)
      .then(() => {
        canExecute = true
      })
      .catch(err => {
        canExecute = false
      })

    // If the executable isn't executable, rebuild it
    if (!canExecute) {
      return false
    }

    if (cacheKey === cacheHashEntropy) {
      // Everything seems to match, we're good.
      return true
    }
  }

  // There wasn't even a cache file, it's dirty.
  return false
}

export async function mutatePackage(pkg: Package, project: Project, opts: InstallOptions) {
  const { packageLocation, packageFs } = await initializePackageEnvironment(pkg, project)

  // console.log(`pkg.version: ${pkg.version} -> ${pkg.version.replace('npm%3A', '')}`)

  // Strip out everything but the naked version number
  pkg.version = pkg.version.replace('npm%3A', '')

  // Find our template string
  const template = project.configuration.get(`redirectAppBuilderTemplate`)

  // Run our template
  const packageToFetch = runTemplate(template, {
    platform: process.platform,
    arch: process.arch,
  })

  const cacheHashEntropy = `${cacheVersion}/${packageToFetch}-${pkg.version}-${
    process.platform
  }-${normalisedArch()}`.replace(/\//g, '-')

  // opts.report.reportInfo(MessageName.UNNAMED, `Fetching ${packageToFetch} at version ${pkg.version}`)

  // Check if the cache key exists / matches
  const cacheKeyLocation = ppath.join(packageLocation, `.cache_key` as Filename)

  if (await cacheMatch(packageFs, cacheKeyLocation, packageLocation, cacheHashEntropy)) {
    opts.report.reportInfo(MessageName.UNNAMED, `${packageToFetch} cache keys match, skipping installation`)
    return
  }

  const replacementLocator = structUtils.makeLocator(
    structUtils.makeDescriptor(structUtils.parseIdent(packageToFetch), pkg.version),
    `npm:${pkg.version}`,
  )

  const fetcher = project.configuration.makeFetcher()

  let replacementPackage: FetchResult
  try {
    replacementPackage = await fetcher.fetch(replacementLocator, {
      cache: opts.cache,
      checksums: project.storedChecksums,
      report: opts.report,
      project: project,
      fetcher: fetcher,
    })
  } catch (e) {
    console.error(e)
    throw e
  }

  const cancellationSignal = { cancel: false }

  // First find the packageJson location
  let packageJsonLocation: PortablePath | null = null
  await miscUtils.releaseAfterUseAsync(async () => {
    await walk(
      replacementPackage.packageFs,
      `.` as PortablePath,
      async (filesystem, filepath) => {
        if (filepath.endsWith(`package.json`)) {
          // We've found it
          packageJsonLocation = filepath

          cancellationSignal.cancel = true
        }
      },
      cancellationSignal,
    )
  })

  if (!packageJsonLocation) {
    throw new Error(`Could not find package.json in ${packageToFetch}`)
  }

  const rootToRemove = ppath.dirname(packageJsonLocation)

  // Reset the cancellation signal
  cancellationSignal.cancel = false

  // For every file in the package, move it into our old one
  await miscUtils.releaseAfterUseAsync(async () => {
    await walk(
      replacementPackage.packageFs,
      `.` as PortablePath,
      async (filesystem, filepath) => {
        // Read every file
        const fileContents = await filesystem.readFilePromise(filepath)

        // Remove the package pathing to get a local path from the folder with
        // the package.json in it
        const partialPath = filepath.replace(rootToRemove, '.') as PortablePath

        // Add that relative path onto the to-be-replaced package location
        const newPath = ppath.join(packageLocation, partialPath)

        // Create the folders
        await packageFs.mkdirpPromise(ppath.dirname(newPath))

        // Copy it to the new location
        await packageFs.writeFilePromise(newPath, fileContents)

        // If it's in the bin folder, make it executable
        if (ppath.basename(ppath.dirname(newPath)) === `bin`) {
          await packageFs.chmodPromise(newPath, 0o755)
        }
      },
      cancellationSignal,
    )
  }, replacementPackage.releaseFs)

  // Write the cache key
  await packageFs.writeFilePromise(cacheKeyLocation, cacheHashEntropy)

  opts.report.reportInfo(MessageName.UNNAMED, `Installed ${packageToFetch} over ${structUtils.stringifyLocator(pkg)}`)
}

async function initializePackageEnvironment(locator: Locator, project: Project) {
  const pkg = project.storedPackages.get(locator.locatorHash)
  if (!pkg)
    throw new Error(`Package for ${structUtils.prettyLocator(project.configuration, locator)} not found in the project`)

  return await ZipOpenFS.openPromise(
    async (zipOpenFs: ZipOpenFS) => {
      const configuration = project.configuration

      const linkers = project.configuration.getLinkers()
      const linkerOptions = { project, report: new StreamReport({ stdout: new PassThrough(), configuration }) }

      const linker = linkers.find(linker => linker.supportsPackage(pkg, linkerOptions))
      if (!linker)
        throw new Error(
          `The package ${structUtils.prettyLocator(
            project.configuration,
            pkg,
          )} isn't supported by any of the available linkers`,
        )

      const packageLocation = await linker.findPackageLocation(pkg, linkerOptions)
      const packageFs = new CwdFS(packageLocation, { baseFs: zipOpenFs })

      return { packageLocation, packageFs }
    },
    {
      libzip: await getLibzipPromise(),
    },
  )
}
