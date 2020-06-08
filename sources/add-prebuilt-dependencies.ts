import {Descriptor, Locator, Project, structUtils} from '@yarnpkg/core';

function runTemplate(template: string, templateValues: { [key: string]: string }) {
  for (const [key, value] of Object.entries(templateValues))
    template = template.replace(new RegExp(`{${key}}`, `g`), value);

  return template;
}

export const reduceDependency = async (
  dependency: Descriptor,
  project: Project,
  locator: Locator,
) => {
  
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
  
  // Return our new dependency
  return structUtils.makeDescriptor(structUtils.parseIdent(replaceWith), dependency.range);
};
