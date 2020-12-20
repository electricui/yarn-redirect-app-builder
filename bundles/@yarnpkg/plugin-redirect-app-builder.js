/* eslint-disable */
module.exports = {
name: "@yarnpkg/plugin-redirect-app-builder",
factory: function (require) {
var plugin;plugin=(()=>{"use strict";var e={140:(e,t,r)=>{r.r(t),r.d(t,{default:()=>u});const a=require("@yarnpkg/core"),i=require("@yarnpkg/fslib"),n=require("@yarnpkg/libzip");const s=async(e,t,r,a)=>{if(a.cancel)return;const n=await e.readdirPromise(t);await Promise.all(n.map(async n=>{if(a.cancel)return;const o=i.ppath.join(t,n),c=await e.statPromise(o);c.isDirectory()?await s(e,o,r,a):c.isFile()&&await r(e,o)}))},o=require("stream");async function c(e,t,r){const{packageLocation:c,packageFs:p}=await async function(e,t){const r=t.storedPackages.get(e.locatorHash);if(!r)throw new Error(`Package for ${a.structUtils.prettyLocator(t.configuration,e)} not found in the project`);return await i.ZipOpenFS.openPromise(async e=>{const n=t.configuration,s=t.configuration.getLinkers(),c={project:t,report:new a.StreamReport({stdout:new o.PassThrough,configuration:n})},p=s.find(e=>e.supportsPackage(r,c));if(!p)throw new Error(`The package ${a.structUtils.prettyLocator(t.configuration,r)} isn't supported by any of the available linkers`);const l=await p.findPackageLocation(r,c);return{packageLocation:l,packageFs:new i.CwdFS(l,{baseFs:e})}},{libzip:await(0,n.getLibzipPromise)()})}(e,t),l=function(e,t){for(const[r,a]of Object.entries(t))e=e.replace(new RegExp(`{${r}}`,"g"),a);return e}(t.configuration.get("redirectAppBuilderTemplate"),{platform:process.platform,arch:process.arch}),u=`1/${l}-${e.version}-${process.platform}-${function(){switch(process.arch){case"arm":return"armv7l";default:return process.arch}}()}`.replace(/\//g,"-"),d=i.ppath.join(c,".cache_key");if(await p.existsPromise(d)){if((await p.readFilePromise(d)).toString()===u)return void r.report.reportInfo(a.MessageName.UNNAMED,l+" cache keys match, skipping installation")}const f=a.structUtils.makeLocator(a.structUtils.makeDescriptor(a.structUtils.parseIdent(l),e.version),"npm:"+e.version),g=t.configuration.makeFetcher();let h;try{h=await g.fetch(f,{cache:r.cache,checksums:t.storedChecksums,report:r.report,project:t,fetcher:g})}catch(e){throw console.error(e),e}const m={cancel:!1};let w=null;if(await a.miscUtils.releaseAfterUseAsync(async()=>{await s(h.packageFs,".",async(e,t)=>{t.endsWith("package.json")&&(w=t,m.cancel=!0)},m)}),!w)throw new Error("Could not find package.json in "+l);const y=i.ppath.dirname(w);m.cancel=!1,await a.miscUtils.releaseAfterUseAsync(async()=>{await s(h.packageFs,".",async(e,t)=>{const r=await e.readFilePromise(t),a=t.replace(y,"."),n=i.ppath.join(c,a);await p.mkdirpPromise(i.ppath.dirname(n)),await p.writeFilePromise(n,r),"bin"===i.ppath.basename(i.ppath.dirname(n))&&await p.chmodPromise(n,493)},m)},h.releaseFs),await p.writeFilePromise(d,u),r.report.reportInfo(a.MessageName.UNNAMED,`Installed ${l} over ${a.structUtils.stringifyLocator(e)}`)}function p(e){return"app-builder-bin"===e.name&&null===e.scope}const l={"3.5.10":"3.5.11"};const u={fetchers:[class{supports(e,t){return!!e.reference.startsWith("appbuilder:")}getLocalPath(e,t){return null}async fetch(e,t){const r=new i.NodeFS,{zipPackage:s}=await this.fetchPrebuild(e,t),o=s.getRealPath();await i.xfs.chmodPromise(o,420);const c=`${t.cache.cacheKey}/${e.locatorHash}`,p=t.cache.getLocatorPath(e,c);if(t.cache.markedFiles.add(p),!p)throw new Error("Assertion failed: Expected the cache path to be available");await i.xfs.mkdirpPromise(i.ppath.dirname(p)),await i.xfs.movePromise(o,p);let l=null;const u=await(0,n.getLibzipPromise)();return{packageFs:new i.LazyFS(()=>a.miscUtils.prettifySyncErrors(()=>l=new i.ZipFS(p,{baseFs:r,libzip:u,readOnly:!0}),r=>`Failed to open the cache entry for ${a.structUtils.prettyLocator(t.project.configuration,e)}: ${r}`),i.ppath),releaseFs:()=>{null!==l&&l.discardAndClose()},prefixPath:a.structUtils.getIdentVendorPath(e),localPath:this.getLocalPath(e,t),checksum:c}}async fetchPrebuild(e,t){const r=await i.xfs.mktempPromise(),s=i.ppath.join(r,"prebuilt.zip"),o=a.structUtils.getIdentVendorPath(e),c=new i.ZipFS(s,{libzip:await(0,n.getLibzipPromise)(),create:!0});await c.mkdirpPromise(o);const p=new i.CwdFS(o,{baseFs:c});return await p.writeJsonPromise("package.json",{name:a.structUtils.slugifyLocator(e),preferUnplugged:!0}),c.saveAndClose(),{zipPackage:c}}}],resolvers:[class{supportsDescriptor(e,t){return!!e.range.startsWith("appbuilder:")}supportsLocator(e,t){return!!e.reference.startsWith("appbuilder:")}shouldPersistResolution(e,t){return!1}bindDescriptor(e,t,r){return e}getResolutionDependencies(e,t){return[]}async getCandidates(e,t,r){if(!r.fetchOptions)throw new Error("Assertion failed: This resolver cannot be used unless a fetcher is configured");return[a.structUtils.makeLocator(e,e.range)]}async getSatisfying(e,t,r){return null}async resolve(e,t){const r=e.reference.match(new RegExp("appbuilder<(.*)>"));if(!r)throw new Error("Could not decode app-builder-bin version");return{...e,version:r[1],languageName:t.project.configuration.get("defaultLanguageName"),linkType:a.LinkType.HARD,dependencies:new Map,peerDependencies:new Map,dependenciesMeta:new Map,peerDependenciesMeta:new Map,bin:new Map}}}],hooks:{afterAllInstalled:async function(e,t){await t.report.startTimerPromise("Build utility resolution",async()=>{await async function(e,t){for(const r of e.storedPackages.values())if(p(r)){try{await c(r,e,t)}catch(e){t.report.reportInfo(a.MessageName.UNNAMED,"Couldn't mutate "+a.structUtils.stringifyLocator(r)),console.error(e)}break}}(e,t)})},registerPackageExtensions:async function(e,t){t(a.structUtils.parseDescriptor("app-builder-bin@*",!0),{preferUnplugged:!0})},reduceDependency:async(e,t,r,i,n)=>{if("app-builder-bin"===e.name&&null===e.scope){const t=l[e.range]?l[e.range]:e.range,r=a.structUtils.makeDescriptor(e,a.structUtils.makeRange({protocol:"appbuilder:",source:a.structUtils.stringifyDescriptor(e),selector:`appbuilder<${t}>`,params:null}));return n.resolveOptions.report.reportInfo(a.MessageName.UNNAMED,"Found a dependency to replace: "+a.structUtils.stringifyDescriptor(e)),r}return e}},configuration:{redirectAppBuilderTemplate:{description:"The template to build the replacement app-builder-bin dependency",type:a.SettingsType.STRING,default:"@electricui/app-builder-bin-{platform}-{arch}"}}}}},t={};function r(a){if(t[a])return t[a].exports;var i=t[a]={exports:{}};return e[a](i,i.exports,r),i.exports}return r.d=(e,t)=>{for(var a in t)r.o(t,a)&&!r.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r(140)})();
return plugin;
}
};