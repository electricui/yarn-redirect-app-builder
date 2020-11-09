import { Descriptor, Locator, MessageName, Project, ResolveOptions, structUtils } from '@yarnpkg/core'

import { Resolver } from 'dns'

export const reduceDependency = async (
  dependency: Descriptor,
  project: Project,
  locator: Locator,
  initialDependency: Descriptor,
  extra: { resolver: Resolver; resolveOptions: ResolveOptions },
) => {
  if (dependency.name === `app-builder-bin` && dependency.scope === null) {
    const descriptor = structUtils.makeDescriptor(
      dependency,
      structUtils.makeRange({
        protocol: `appbuilder:`,
        source: structUtils.stringifyDescriptor(dependency),
        selector: `appbuilder<${dependency.range}>`,
        params: null,
      }),
    )

    extra.resolveOptions.report.reportInfo(
      MessageName.UNNAMED,
      `Found a dependency to replace: ${structUtils.stringifyDescriptor(dependency)}`,
    )

    return descriptor
  }

  return dependency
}
