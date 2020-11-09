import { Plugin, SettingsType } from '@yarnpkg/core'

import { AppBuilderFetcher } from './fetcher'
import { AppBuilderResolver } from './resolver'
import { afterAllInstalled } from './afterAllInstalled'
import { reduceDependency } from './reduceDependency'
import { registerPackageExtensions } from './registerPackageExtensions'

declare module '@yarnpkg/core' {
  interface ConfigurationValueMap {
    redirectAppBuilderTemplate: string
  }
}

const plugin: Plugin = {
  fetchers: [AppBuilderFetcher],
  resolvers: [AppBuilderResolver],
  hooks: {
    afterAllInstalled,
    registerPackageExtensions,
    reduceDependency,
  },
  configuration: {
    redirectAppBuilderTemplate: {
      description: `The template to build the replacement app-builder-bin dependency`,
      type: SettingsType.STRING as const,
      default: `@electricui/app-builder-bin-{platform}-{arch}`,
    },
  },
}

export default plugin
