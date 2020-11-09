import { MessageName, Package, Project, structUtils } from '@yarnpkg/core'

import { InstallOptions } from '@yarnpkg/core/lib/Project'
import { mutatePackage } from './mutation'

function isAppBuilderPackage(pkg: Package) {
  // Only packages named exactly `app-builder-bin`, not `scoped@app-builder-bin` for example
  if (pkg.name === `app-builder-bin` && pkg.scope === null) {
    return true
  }

  return false
}

async function findAppBuilderPackages(project: Project, opts: InstallOptions) {
  for (const pkg of project.storedPackages.values()) {
    if (isAppBuilderPackage(pkg)) {
      try {
        await mutatePackage(pkg, project, opts)
      } catch (e) {
        opts.report.reportInfo(MessageName.UNNAMED, `Couldn't mutate ${structUtils.stringifyLocator(pkg)}`)

        console.error(e)
      }
      break
    }
  }
}

export async function afterAllInstalled(project: Project, opts: InstallOptions) {
  await opts.report.startTimerPromise(`Build utility resolution`, async () => {
    await findAppBuilderPackages(project, opts)
  })
}
