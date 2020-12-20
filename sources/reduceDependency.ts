import { Descriptor, Locator, MessageName, Project, ResolveOptions, structUtils, Resolver } from '@yarnpkg/core'

const rangeReplacements = {
  '3.5.10': '3.5.11',
}

export const reduceDependency = async (
  dependency: Descriptor,
  project: Project,
  locator: Locator,
  initialDependency: Descriptor,
  extra: { resolver: Resolver; resolveOptions: ResolveOptions },
) => {
  if (dependency.name === `app-builder-bin` && dependency.scope === null) {
    const range = rangeReplacements[dependency.range] ? rangeReplacements[dependency.range] : dependency.range

    const descriptor = structUtils.makeDescriptor(
      dependency,
      structUtils.makeRange({
        protocol: `appbuilder:`,
        source: structUtils.stringifyDescriptor(dependency),
        selector: `appbuilder<${range}>`,
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
