import { FakeFS, PortablePath, ppath } from '@yarnpkg/fslib'

/**
 * This renames `arm` to `armv7l` to be consistent with the prebuild artifacts
 */
export function normalisedArch() {
  switch (process.arch) {
    case `arm`:
      return `armv7l`

    default:
      return process.arch
  }
}

export const walk = async (
  filesystem: FakeFS<PortablePath>,
  currentPath: PortablePath,
  callback: (filesystem: FakeFS<PortablePath>, filepath: PortablePath) => Promise<void>,
  cancellationSignal: { cancel: boolean },
) => {
  if (cancellationSignal.cancel) return

  const files = await filesystem.readdirPromise(currentPath)

  await Promise.all(
    files.map(async filename => {
      if (cancellationSignal.cancel) return

      const filepath = ppath.join(currentPath, filename)

      const stat = await filesystem.statPromise(filepath)

      if (stat.isDirectory()) {
        await walk(filesystem, filepath, callback, cancellationSignal)
      } else if (stat.isFile()) {
        await callback(filesystem, filepath)
      }
    }),
  )
}
