import {Descriptor, Locator, Project, ResolveOptions, Resolver, structUtils} from '@yarnpkg/core';

function runTemplate(template: string, templateValues: { [key: string]: string }) {
  for (const [key, value] of Object.entries(templateValues))
    template = template.replace(new RegExp(`{${key}}`, `g`), value);

  return template;
}

export const reduceDependency = async (dependency: Descriptor, project: Project, locator: Locator, initialDependency: Descriptor, extra: {
  resolver: Resolver;
  resolveOptions: ResolveOptions;
}) => {
  
  // Check if this is the package we're looking for
  if (dependency.name !== `app-builder-bin` || dependency.scope !== null) {
    return dependency
  }

  // Find our template string
  const template = project.configuration.get<string>(`redirectAppBuilderTemplate`)

  // Run our template
  const replaceWith = runTemplate(template, {
    platform: process.platform,
    arch: process.arch,
  });

  // extra.resolveOptions.report.reportInfo(0, `Found app-builder-bin, re-routing to ${replaceWith}`);

  // Build our new descriptor that will be passed to the resolver
  const selector = `npm<${replaceWith}@${dependency.range}>`; 

  const newDescriptor = structUtils.makeDescriptor(dependency, structUtils.makeRange({
    protocol: `app-builder-bin:`,
    source: `app-builder-bin<${process.platform}-${process.arch}>`,
    selector: selector,
    params: null,
  }));

  return newDescriptor
};
