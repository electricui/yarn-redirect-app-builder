import {Descriptor, DescriptorHash, Locator, MinimalResolveOptions, Package, ResolveOptions, Resolver} from '@yarnpkg/core';

import {structUtils}                                                                                   from '@yarnpkg/core';

export class AppBuilderResolver implements Resolver {
  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    if (!descriptor.range.startsWith(`app-builder-bin:`))
      return false;

    return true;
  }

  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    // Once transformed into locators, the descriptors are resolved by the NpmSemverResolver
    return false;
  }

  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions): never {
    // Once transformed into locators, the descriptors are resolved by the NpmSemverResolver
    throw new Error(`Unreachable`);
  }

  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    return descriptor;
  }

  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    const match = descriptor.range.match(new RegExp(`npm<(.*)>`));

    if (!match) {
        throw new Error("Could not decode app-builder-bin rewrite")
    }
    
    const nextDescriptor = structUtils.parseDescriptor(match[1], true);

    return opts.resolver.getResolutionDependencies(nextDescriptor, opts);
  }

  async getCandidates(descriptor: Descriptor, dependencies: Map<DescriptorHash, Package>, opts: ResolveOptions) {
    const match = descriptor.range.match(new RegExp(`npm<(.*)>`));

    if (!match) {
        throw new Error("Could not decode app-builder-bin rewrite")
    }

    const nextDescriptor = structUtils.parseDescriptor(match[1], true);
    
    return await opts.resolver.getCandidates(nextDescriptor, dependencies, opts);
  }

  resolve(locator: Locator, opts: ResolveOptions): never {
    // Once transformed into locators, the descriptors are resolved by the NpmSemverResolver
    throw new Error(`Unreachable`);
  }
}
