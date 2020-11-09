import { Configuration, Descriptor, structUtils } from '@yarnpkg/core'

export async function registerPackageExtensions(
  configuration: Configuration,
  registerPackageExtension: (descriptor: Descriptor, extensionData: any) => void,
) {
  // Have the bin package prefer to be unplugged
  registerPackageExtension(structUtils.parseDescriptor(`app-builder-bin@*`, true), {
    preferUnplugged: true,
  })
}
