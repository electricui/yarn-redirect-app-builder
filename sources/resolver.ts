import {
  Descriptor,
  DescriptorHash,
  LinkType,
  Locator,
  MinimalResolveOptions,
  Package,
  ResolveOptions,
  Resolver,
  structUtils,
} from '@yarnpkg/core'

export class AppBuilderResolver implements Resolver {
  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    if (!descriptor.range.startsWith(`appbuilder:`)) return false

    return true
  }

  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    if (!locator.reference.startsWith(`appbuilder:`)) return false

    return true
  }

  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions) {
    return false
  }

  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    return descriptor
  }

  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return {}
  }

  async getCandidates(descriptor: Descriptor, dependencies: unknown, opts: ResolveOptions) {
    if (!opts.fetchOptions)
      throw new Error(`Assertion failed: This resolver cannot be used unless a fetcher is configured`)

    return [structUtils.makeLocator(structUtils.parseIdent(`bindings`), descriptor.range)]
  }

  async getSatisfying(descriptor: Descriptor, dependencies: Record<string, Package>, locators: Array<Locator>, opts: ResolveOptions) {
    const [locator] = await this.getCandidates(descriptor, dependencies, opts);

    return {
      locators: locators.filter(candidate => candidate.locatorHash === locator.locatorHash),
      sorted: false,
    };
  }

  async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
    // We need to extract the version from the locator
    const match = locator.reference.match(new RegExp(`appbuilder<(.*)>`))

    if (!match) {
      throw new Error('Could not decode app-builder-bin version')
    }

    return {
      ...locator,

      version: match[1],

      languageName: opts.project.configuration.get(`defaultLanguageName`),
      linkType: LinkType.HARD,

      dependencies: new Map(),
      peerDependencies: new Map(),

      dependenciesMeta: new Map(),
      peerDependenciesMeta: new Map(),

      bin: new Map(),
    }
  }
}
