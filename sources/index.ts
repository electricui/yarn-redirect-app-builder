import {Hooks as CoreHooks, Plugin, SettingsType} from '@yarnpkg/core';

import {reduceDependency}                         from './add-prebuilt-dependencies';

const plugin: Plugin<CoreHooks> = {
  hooks: {
    reduceDependency,
  },
  configuration: {
    redirectAppBuilderTemplate: {
      description: `The template to build the replacement app-builder-bin dependency`,
      type: SettingsType.STRING,
      default: `@electricui/app-builder-bin-{platform}-{arch}`,
    },
  },
};

// eslint-disable-next-line arca/no-default-export
export default plugin;
