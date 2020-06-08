# `@electricui/yarn-redirect-app-builder`

For Yarn v2.

To install, import from the repository.

```
yarn plugin import https://raw.githubusercontent.com/electricui/yarn-redirect-app-builder/master/bundles/%40yarnpkg/plugin-redirect-app-builder.js
```

The [app-builder](https://github.com/develar/app-builder) package publishes the matrix of build platforms and architectures in every download. This plugin works in conjunction with a [fork of app-builder](https://github.com/electricui/app-builder) that publishes each OS and Arch separately. 

This plugin redirects dependencies on `app-builder-bin` to `app-builder-bin-darwin-x64` for example on a 64bit MacOS machine.

## Configuration

Configuration can be set in your .yarncr.yml file.

The package redirected to can be changed if you want to use your own version of the packages.

```yml
redirectAppBuilderTemplate: '@electricui/app-builder-bin-{platform}-{arch}'
```
