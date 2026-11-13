var RUNTIME_PUBLIC_PATH = "server/chunks/[turbopack]_runtime.js";
var RELATIVE_ROOT_PATH = "..";
var ASSET_PREFIX = "/";
// Apply forwarded globals from workerData if running in a worker thread
if (typeof require !== 'undefined') {
    try {
        var { workerData } = require('worker_threads');
        if (workerData?.__turbopack_globals__) {
            Object.assign(globalThis, workerData.__turbopack_globals__);
            // Remove internal data so it's not visible to user code
            delete workerData.__turbopack_globals__;
        }
    } catch (_) {
        // Not in a worker thread context, ignore
    }
}
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
/// <reference path="./async-module.ts" />
/**
 * Describes why a module was instantiated.
 * Shared between browser and Node.js runtimes.
 */ var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    /**
   * The module was instantiated because it was included in a chunk's hot module
   * update.
   * SourceData is an array of ModuleIds or undefined.
   */ SourceType[SourceType["Update"] = 2] = "Update";
    return SourceType;
}(SourceType || {});
/**
 * Flag indicating which module object type to create when a module is merged. Set to `true`
 * by each runtime that uses ModuleWithDirection (browser dev-base.ts, nodejs dev-base.ts,
 * nodejs build-base.ts). Browser production (build-base.ts) leaves it as `false` since it
 * uses plain Module objects.
 */ let createModuleWithDirectionFlag = false;
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache.get(id);
    if (module === undefined) {
        if (createModuleWithDirectionFlag) {
            // set in development modes for hmr support
            module = createModuleWithDirection(id);
        } else {
            module = createModuleObject(id);
        }
        moduleCache.set(id, module);
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
function createModuleWithDirection(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined,
        parents: [],
        children: []
    };
}
const BindingTag_Value = 0;
/**
 * Terminates a module's group of entries in an {@link EsmReexports} list.
 */ const REEXPORT_GROUP_END = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings, dynamic) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    // The properties defined above are already non-configurable and
    // non-writable, so the namespace's existing exports are effectively
    // immutable. Sealing additionally makes the object non-extensible, matching
    // real ESM-namespace semantics. Modules with dynamic re-exports
    // (`export *` from a CommonJS module) must stay extensible so the dynamic
    // export proxy can surface keys discovered at runtime, so skip the seal for
    // them.
    if (!dynamic) Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id, dynamic) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings, dynamic);
}
contextPrototype.s = esmExport;
/**
 * Registers re-exports that all forward to properties of other modules.
 *
 * This is a compact spelling of the pattern
 *
 * ```js
 * var ns = context.i(moduleId)
 * context.s([exportName, () => ns[importedName], ...])
 * ```
 *
 * The list is a flat sequence of groups. Each group starts with the source the exports come from,
 * followed by that group's entries, and is terminated by the `0` sentinel (or the end of the list).
 *
 * The group head is either a **module id**, which is instantiated here:
 *
 * ```js
 * context.S([
 *   76061, 'default', 'f', 'named', 'A', 0,
 *   29842, 'otherModule', 'f',
 * ])
 * ```
 *
 * or the **namespace value** of a module that has already been imported, which is used directly:
 *
 * ```js
 * var ns1 = context.i(76061)
 * context.S([ns1, 'default', 'f', 'named', 'A'])
 * ```
 *
 * The producer picks the namespace form when it has generated the import anyway -- because some
 * later import must not be reordered past it -- so nothing is instantiated twice. The two are told
 * apart by type: a module id is always a string or number. A CommonJS function export produces a
 * callable namespace value, so namespace heads can be functions as well as objects.
 *
 * Entries are `exportName, importedName` pairs, except when a group holds exactly one string. That
 * string is then a comma-joined list of the same pairs, which saves the repeated quoting:
 *
 * ```js
 * context.S([
 *   76061, 'default,f,named,A', 0,
 *   29842, 'otherModule,f',
 * ])
 * ```
 *
 * The producer picks that spelling independently for each group whose names contain no commas,
 * since that group's names are recovered by splitting on them.
 *
 * Groups whose head is a module id are instantiated in list order, at the point where the call
 * appears, so the producer must not merge such a group across an import of another module. The
 * destination reuses a source data value or getter descriptor when one exists, falling back to a
 * wrapper getter for dynamic/proxy/inherited properties.
 *
 * `id` names the module the exports belong to when this module was merged into a scope-hoisting
 * group, exactly as it does for {@link EsmExport}.
 *
 * Only the source descriptor's payload (value or getter) is reused. {@link esm} still defines a
 * fresh enumerable, non-configurable destination property, and no source setter is ever forwarded.
 */ function esmReexport(list, id) {
    const bindings = [];
    let i = 0;
    while(i < list.length){
        const head = list[i++];
        const start = i;
        while(i < list.length && list[i] !== REEXPORT_GROUP_END)i++;
        const end = i;
        // Skip the sentinel, if this group was terminated by one rather than by the end of the list.
        i++;
        // Module ids are always strings or numbers. Other values are already-imported namespaces;
        // notably, interop with a CommonJS function export produces a callable namespace function.
        // `esmImport` may return a promise for an async module, but re-exports of async modules keep
        // going through `context.s`, so the producer never routes them here and this stays synchronous.
        const namespace = typeof head === 'string' || typeof head === 'number' ? esmImport.call(this, head) : head;
        if (end - start === 1) {
            const pairs = list[start].split(',');
            for(let j = 0; j < pairs.length; j += 2){
                appendReexportBinding(bindings, pairs[j], namespace, pairs[j + 1]);
            }
        } else {
            for(let j = start; j < end; j += 2){
                appendReexportBinding(bindings, list[j], namespace, list[j + 1]);
            }
        }
    }
    esmExport.call(this, bindings, id);
}
contextPrototype.S = esmReexport;
function appendReexportBinding(bindings, exportedName, namespace, importedName) {
    const descriptor = Reflect.getOwnPropertyDescriptor(namespace, importedName);
    if (descriptor) {
        if ('value' in descriptor) {
            // Code generation only routes immutable imported bindings through this helper, so a data
            // descriptor is a constant export and can be captured once.
            bindings.push(exportedName, BindingTag_Value, descriptor.value);
            return;
        }
        if (descriptor.get) {
            // Accessors remain live by reusing the source getter. `esmReexport` is only called by
            // generated code: every group head is either produced by
            // `this.i` or is the namespace variable from a generated `this.i` call. Every getter on such
            // a namespace is receiver-independent: ESM bindings are compiler-generated arrow functions,
            // and the CommonJS/dynamic-namespace paths create arrows in `createGetter` and
            // `getOwnPropertyDescriptor`. The destination can therefore reuse the exact function instead
            // of allocating another wrapper getter.
            bindings.push(exportedName, descriptor.get);
            return;
        }
    }
    // Dynamic/proxy/inherited CommonJS edge cases may not expose a usable own descriptor.
    bindings.push(exportedName, ()=>namespace[importedName]);
}
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        // Returns the re-exported object that provides `prop` as an own property,
        // or `undefined` if none does. The traps share this logic so they always
        // agree on which keys are synthesized from `reexportedObjects`. `default`
        // is never re-exported by `export *`, so it is never synthesized.
        const reexportOwning = (prop)=>{
            if (prop !== 'default') {
                for (const obj of reexportedObjects){
                    if (hasOwnProperty.call(obj, prop)) return obj;
                }
            }
            return undefined;
        };
        // Modules with dynamic re-exports are not sealed by `esm()`, so the
        // target beneath the namespace stays extensible. That is what lets the
        // `ownKeys` and `getOwnPropertyDescriptor` traps legally report keys that
        // exist on `reexportedObjects` but not on the target itself.
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                const obj = reexportOwning(prop);
                return obj && Reflect.get(obj, prop);
            },
            // The namespace is read-only, like a real esm namespace object. The
            // re-exported modules can still mutate their own exports (exposed live
            // via `get`), but mutating the namespace itself is rejected. Refusing
            // here, rather than forwarding to the extensible target, also prevents an
            // assignment/definition from shadowing a dynamic re-export. It also
            // prevents delete from removing a static export.
            set () {
                return false;
            },
            defineProperty () {
                return false;
            },
            deleteProperty () {
                return false;
            },
            // The `has` trap ensures that `'exportName' in starImports` will reflect
            // the truth of whether a key is exported.
            has (target, prop) {
                if (Reflect.has(target, prop)) return true;
                if (prop === 'default' || prop === '__esModule') return false;
                return reexportOwning(prop) !== undefined;
            },
            // ownKeys and getOwnPropertyDescriptor together make the keys enumerable.
            // If a value is returned from `ownKeys` but its property descriptor is
            // not enumerable, it will not be visible to iterator methods.
            // Collectively, they allow code like the following:
            //
            // ```
            // // module.js re-exports dynamic CJS exports
            // export * from './legacyModule.cjs'
            //
            // // from another JS file, reference the re-exported dynamic values
            // import * as Namespace from './module.js'
            // Object.keys(Namespace)
            // ```
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            },
            getOwnPropertyDescriptor (target, prop) {
                const own = Reflect.getOwnPropertyDescriptor(target, prop);
                if (own || prop === 'default' || prop === '__esModule') return own;
                const obj = reexportOwning(prop);
                if (obj) {
                    // Synthetic keys don't exist on the target, so they MUST be
                    // reported as configurable. However the set/delete traps above will
                    // prevent them from actually being changed
                    return {
                        enumerable: true,
                        configurable: true,
                        get: ()=>Reflect.get(obj, prop)
                    };
                }
                return undefined;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * Remove fragments and query parameters since they are never part of the context map keys
 *
 * This matches how we parse patterns at resolving time.  Arguably we should only do this for
 * strings passed to `import` but the resolve does it for `import` and `require` and so we do
 * here as well.
 */ function parseRequest(request) {
    // Per the URI spec fragments can contain `?` characters, so we should trim it off first
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    const hashIndex = request.indexOf('#');
    if (hashIndex !== -1) {
        request = request.substring(0, hashIndex);
    }
    const queryIndex = request.indexOf('?');
    if (queryIndex !== -1) {
        request = request.substring(0, queryIndex);
    }
    return request;
}
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Install the factory for each module ID that doesn't already have one.
        // When some IDs in this group already have a factory, reuse that existing
        // group factory for the missing IDs to keep all IDs in the group consistent.
        // Otherwise, install the factory from this chunk.
        const moduleFactoryFn = chunkModules[end];
        let existingGroupFactory = undefined;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            const existingFactory = moduleFactories.get(id);
            if (existingFactory) {
                existingGroupFactory = existingFactory;
                break;
            }
        }
        const factoryToInstall = existingGroupFactory ?? moduleFactoryFn;
        let didInstallFactory = false;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            if (!moduleFactories.has(id)) {
                if (!didInstallFactory) {
                    if (factoryToInstall === moduleFactoryFn) {
                        applyModuleFactoryName(moduleFactoryFn);
                    }
                    didInstallFactory = true;
                }
                moduleFactories.set(id, factoryToInstall);
                newModuleId?.(id);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * Constructs an error message for when a module factory is not available.
 */ function factoryNotAvailableMessage(moduleId, sourceType, sourceData) {
    let instantiationReason;
    switch(sourceType){
        case 0:
            instantiationReason = `as a runtime entry of chunk ${sourceData}`;
            break;
        case 1:
            instantiationReason = `because it was required from module ${sourceData}`;
            break;
        case 2:
            instantiationReason = 'because of an HMR update';
            break;
        default:
            invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
    }
    return `Module ${moduleId} was instantiated ${instantiationReason}, but the module factory is not available.`;
}
/**
 * Returns a `file://` URL under a synthetic directory named after `root`
 * (`ROOT` for the project root), for when the real filesystem path is unknown.
 * The root name and path segments are percent-encoded so the result is always
 * a valid file URI.
 */ function placeholderFileUrl(modulePath, root) {
    return `file:///${encodeURIComponent(root ?? 'ROOT')}/${modulePath.split('/').map(encodeURIComponent).join('/')}`;
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="../shared/runtime/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/**
 * Returns an absolute `file://` URL for the given module path, which is
 * relative to the project root or the named `root`.
 *
 * Uses `url.pathToFileURL` so that the resulting URL is a valid file URI on
 * all platforms (forward slashes on Windows, drive letters handled
 * correctly, path segments URL-encoded).
 *
 * The location of a named `root` isn't known at runtime (the output may have
 * been moved away from the sources), so this returns a placeholder URL for it.
 */ function resolveFileUrl(modulePath, root) {
    if (root !== undefined) {
        return placeholderFileUrl(modulePath, root);
    }
    return require('url').pathToFileURL(resolveAbsolutePath(modulePath)).href;
}
Context.prototype.F = resolveFileUrl;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../../shared/runtime/runtime-utils.ts" />
/// <reference path="../../shared-node/base-externals-utils.ts" />
/// <reference path="../../shared-node/node-externals-utils.ts" />
/// <reference path="./nodejs-globals.d.ts" />
/**
 * Base Node.js runtime shared between production and development.
 * Contains chunk loading, module caching, and other non-HMR functionality.
 */ process.env.TURBOPACK = '1';
const url = require('url');
const moduleFactories = new Map();
const moduleCache = new Map();
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
/**
 * Exports a URL value. No suffix is added in Node.js runtime.
 */ function exportUrl(urlValue, id) {
    exportValue.call(this, urlValue, id);
}
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
    loadedChunks.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, {
            cause
        });
        error.name = 'ChunkLoadError';
        throw error;
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, {
                cause
            });
            error.name = 'ChunkLoadError';
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
// Shared runtime primitive: the root that on-disk chunk paths are resolved
// against. Used by the bundled wasm helper (exposed as `__turbopack_runtime_root__`).
contextPrototype.w = RUNTIME_ROOT;
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-base.ts" />
/**
 * Production Node.js runtime.
 * Uses ModuleWithDirection and simple module instantiation without HMR support.
 */ // moduleCache and moduleFactories are declared in runtime-base.ts
// this is read in runtime-utils.ts so it creates a module with direction for hmr
createModuleWithDirectionFlag = true;
const nodeContextPrototype = Context.prototype;
nodeContextPrototype.q = exportUrl;
nodeContextPrototype.M = moduleFactories;
// Cast moduleCache to ModuleWithDirection for production mode
nodeContextPrototype.c = moduleCache;
nodeContextPrototype.R = resolvePathFromModule;
nodeContextPrototype.C = clearChunkCache;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        throw new Error(factoryNotAvailableMessage(id, sourceType, sourceData));
    }
    const module1 = createModuleWithDirection(id);
    const exports = module1.exports;
    moduleCache.set(id, module1);
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    ;
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache.get(id);
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, SourceType.Parent, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, SourceType.Runtime, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache.get(moduleId);
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/[externals]_crypto_1hz30cd964z61._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[externals]_crypto_1hz30cd964z61._.js");
      case "server/chunks/[root-of-the-server]__0ha36-eqjdk8i._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0ha36-eqjdk8i._.js");
      case "server/chunks/[root-of-the-server]__0pftg1tft_tw9._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0pftg1tft_tw9._.js");
      case "server/chunks/[root-of-the-server]__19yh81lsu2nis._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__19yh81lsu2nis._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/node_modules_@auth0_nextjs-auth0_dist_utils_constants_0ourv87n4uxyj.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/node_modules_@auth0_nextjs-auth0_dist_utils_constants_0ourv87n4uxyj.js");
      case "server/chunks/node_modules_@auth0_nextjs-auth0_dist_utils_dpopUtils_1oeo-39uv32jw.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/node_modules_@auth0_nextjs-auth0_dist_utils_dpopUtils_1oeo-39uv32jw.js");
      case "server/chunks/node_modules_next_1cxg49z2-tk1s._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/node_modules_next_1cxg49z2-tk1s._.js");
      case "server/chunks/node_modules_next_dist_1sqc74sy9prue._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/node_modules_next_dist_1sqc74sy9prue._.js");
      case "server/chunks/ssr/[root-of-the-server]__07iu0by8_6xka._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__07iu0by8_6xka._.js");
      case "server/chunks/ssr/[root-of-the-server]__0t2--r5y9vb6r._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0t2--r5y9vb6r._.js");
      case "server/chunks/ssr/[root-of-the-server]__0weft8tw0wxks._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0weft8tw0wxks._.js");
      case "server/chunks/ssr/[root-of-the-server]__1qnyzp14ywrc4._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1qnyzp14ywrc4._.js");
      case "server/chunks/ssr/[root-of-the-server]__1zgivpx69wr-4._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1zgivpx69wr-4._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_1tynjs_q1x62-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1tynjs_q1x62-._.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yrisjoev.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yrisjoev.js");
      case "server/chunks/ssr/components_theme_ThemeProvider_tsx_0tqt0vp72vkyy._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_theme_ThemeProvider_tsx_0tqt0vp72vkyy._.js");
      case "server/chunks/ssr/components_ui_Toast_tsx_0nfofim8wddln._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_ui_Toast_tsx_0nfofim8wddln._.js");
      case "server/chunks/ssr/node_modules_0e7ga4fe7dl9y._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0e7ga4fe7dl9y._.js");
      case "server/chunks/ssr/node_modules_next_1ep9xf4eq8r0p._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_1ep9xf4eq8r0p._.js");
      case "server/chunks/ssr/node_modules_next_dist_0-amwqbrge23p._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0-amwqbrge23p._.js");
      case "server/chunks/ssr/node_modules_next_dist_0ocrceo0c9psx._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0ocrceo0c9psx._.js");
      case "server/chunks/ssr/node_modules_next_dist_13-irqw2i2qvm._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_13-irqw2i2qvm._.js");
      case "server/chunks/ssr/node_modules_next_dist_1khq67j4vo9y4._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1khq67j4vo9y4._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0bew68i643j53._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0bew68i643j53._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j32_ibz4._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j32_ibz4._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9mbf-fh.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9mbf-fh.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0xky89qu.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0xky89qu.js");
      case "server/chunks/ssr/node_modules_next_dist_compiled_@edge-runtime_cookies_index_1kiz_an963mbg.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_compiled_@edge-runtime_cookies_index_1kiz_an963mbg.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_12cvwrhav8wvb.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_12cvwrhav8wvb.js");
      case "server/chunks/ssr/node_modules_next_dist_server_1-93m57aj96gx._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_server_1-93m57aj96gx._.js");
      case "server/chunks/[externals]__1pnsv_2hz9gvn._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[externals]__1pnsv_2hz9gvn._.js");
      case "server/chunks/[root-of-the-server]__1v1-l-83czzsr._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1v1-l-83czzsr._.js");
      case "server/chunks/_0mvy6sw3v2vch._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0mvy6sw3v2vch._.js");
      case "server/chunks/_0rvp8mew6gmyw._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0rvp8mew6gmyw._.js");
      case "server/chunks/_next-internal_server_app_api_invite_[slug]_route_actions_1gro0qvp3d8sx.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_invite_[slug]_route_actions_1gro0qvp3d8sx.js");
      case "server/chunks/lib_server_storage_ts_0mqj3vt0frzd7._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/lib_server_storage_ts_0mqj3vt0frzd7._.js");
      case "server/chunks/lib_server_weddings_ts_0gdam0mx64uqz._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/lib_server_weddings_ts_0gdam0mx64uqz._.js");
      case "server/chunks/node_modules_zod_v4_classic_external_0_xnhi7_4vmfh.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/node_modules_zod_v4_classic_external_0_xnhi7_4vmfh.js");
      case "server/chunks/_0khhvur1x1sr7._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0khhvur1x1sr7._.js");
      case "server/chunks/_1tf-54k5_jp6i._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1tf-54k5_jp6i._.js");
      case "server/chunks/_next-internal_server_app_api_me_route_actions_0j009u9p9e-hk.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_me_route_actions_0j009u9p9e-hk.js");
      case "server/chunks/_1zc3ml70ottsw._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1zc3ml70ottsw._.js");
      case "server/chunks/_next-internal_server_app_api_me_theme_route_actions_02q9pgjsylxt5.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_me_theme_route_actions_02q9pgjsylxt5.js");
      case "server/chunks/[root-of-the-server]__10iiy2xtmynbm._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__10iiy2xtmynbm._.js");
      case "server/chunks/_05qvgre_2ljfb._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_05qvgre_2ljfb._.js");
      case "server/chunks/_next-internal_server_app_api_public_wedding_[slug]_route_actions_0-rkl_y_m55i8.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_public_wedding_[slug]_route_actions_0-rkl_y_m55i8.js");
      case "server/chunks/lib_wedding-slug_ts_1dzidn6k7ius9._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/lib_wedding-slug_ts_1dzidn6k7ius9._.js");
      case "server/chunks/_0q2y8vx_5v8ae._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0q2y8vx_5v8ae._.js");
      case "server/chunks/_next-internal_server_app_api_rsvp_route_actions_1yodjk22onqjt.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_rsvp_route_actions_1yodjk22onqjt.js");
      case "server/chunks/lib_0gmineby514x8._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/lib_0gmineby514x8._.js");
      case "server/chunks/_1cd4wrtn63a_o._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1cd4wrtn63a_o._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_check-slug_route_actions_1h4v1dujxqew0.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_check-slug_route_actions_1h4v1dujxqew0.js");
      case "server/chunks/_13mu97wp7j-gz._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_13mu97wp7j-gz._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_route_actions_0vg-c08scgq-m.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_route_actions_0vg-c08scgq-m.js");
      case "server/chunks/_1kqnp_28i8ys2._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1kqnp_28i8ys2._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_content_route_actions_1e3lvtxl_fs5k.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_content_route_actions_1e3lvtxl_fs5k.js");
      case "server/chunks/[root-of-the-server]__1hsok_4pf57q3._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1hsok_4pf57q3._.js");
      case "server/chunks/_07qhbbwa3sy3b._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_07qhbbwa3sy3b._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_events_route_actions_1ec793ga7yu1r.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_events_route_actions_1ec793ga7yu1r.js");
      case "server/chunks/1oeh_server_app_api_weddings_[id]_events_[eventId]_route_actions_01lv524g7ft-3.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_weddings_[id]_events_[eventId]_route_actions_01lv524g7ft-3.js");
      case "server/chunks/_06qx2agmy92nz._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_06qx2agmy92nz._.js");
      case "server/chunks/1oeh_server_app_api_weddings_[id]_guests_bulk_route_actions_02kntl4sv8ydu.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_weddings_[id]_guests_bulk_route_actions_02kntl4sv8ydu.js");
      case "server/chunks/_0a6sp3lzx990f._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0a6sp3lzx990f._.js");
      case "server/chunks/_02t28n1w9vr17._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_02t28n1w9vr17._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_guests_route_actions_0n963bug4_der.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_guests_route_actions_0n963bug4_der.js");
      case "server/chunks/1jng_app_api_weddings_[id]_guests_[guestId]_events_route_actions_13u1ajfx65gvr.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/1jng_app_api_weddings_[id]_guests_[guestId]_events_route_actions_13u1ajfx65gvr.js");
      case "server/chunks/_0z19fho3x24_8._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0z19fho3x24_8._.js");
      case "server/chunks/1oeh_server_app_api_weddings_[id]_guests_[guestId]_route_actions_0dn23rbl2pod-.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_weddings_[id]_guests_[guestId]_route_actions_0dn23rbl2pod-.js");
      case "server/chunks/_0_8kjg77trsql._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0_8kjg77trsql._.js");
      case "server/chunks/_1umuzva_5cl10._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1umuzva_5cl10._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_photos_route_actions_0t-p_bznbb3zc.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_photos_route_actions_0t-p_bznbb3zc.js");
      case "server/chunks/1oeh_server_app_api_weddings_[id]_photos_[photoId]_route_actions_08hh0oa9op57j.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_weddings_[id]_photos_[photoId]_route_actions_08hh0oa9op57j.js");
      case "server/chunks/_1_9dhe-xjm92j._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1_9dhe-xjm92j._.js");
      case "server/chunks/_0utro3ehbmt6k._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_0utro3ehbmt6k._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_route_actions_01q_4nfd-26kx.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_route_actions_01q_4nfd-26kx.js");
      case "server/chunks/_02weh-896tnyu._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_02weh-896tnyu._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_stats_route_actions_0uve5kchwsvih.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_stats_route_actions_0uve5kchwsvih.js");
      case "server/chunks/_1w_e3_6zi60hx._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1w_e3_6zi60hx._.js");
      case "server/chunks/_next-internal_server_app_api_weddings_[id]_wishes_route_actions_11f1455nxjw_j.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_weddings_[id]_wishes_route_actions_11f1455nxjw_j.js");
      case "server/chunks/_1bt-v0np16fem._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1bt-v0np16fem._.js");
      case "server/chunks/_next-internal_server_app_api_wishes_route_actions_1dk2vt3v1ajia.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_wishes_route_actions_1dk2vt3v1ajia.js");
      case "server/chunks/ssr/[root-of-the-server]__1lrb21xs8c7j3._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1lrb21xs8c7j3._.js");
      case "server/chunks/ssr/_00mavi9hipgwi._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_00mavi9hipgwi._.js");
      case "server/chunks/ssr/_next-internal_server_app_chinh-sach-bao-mat_page_actions_0q5-d3bxou75j.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_chinh-sach-bao-mat_page_actions_0q5-d3bxou75j.js");
      case "server/chunks/ssr/config_landing_ts_0wr6uygqi1haw._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/config_landing_ts_0wr6uygqi1haw._.js");
      case "server/chunks/ssr/node_modules_next_dist_0qndaa_7bshsz._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0qndaa_7bshsz._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892nagajq.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892nagajq.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1alw0e4mfadx-.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1alw0e4mfadx-.js");
      case "server/chunks/ssr/node_modules_next_dist_shared_lib_deployment-id_1e97fn7y0cbl1.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_shared_lib_deployment-id_1e97fn7y0cbl1.js");
      case "server/chunks/ssr/[root-of-the-server]__0fu1gaju25x49._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0fu1gaju25x49._.js");
      case "server/chunks/ssr/_06nfzu4kg3i47._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_06nfzu4kg3i47._.js");
      case "server/chunks/ssr/_0mn9-cg8f39xp._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0mn9-cg8f39xp._.js");
      case "server/chunks/ssr/_125dhn100k6n6._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_125dhn100k6n6._.js");
      case "server/chunks/ssr/_1uaepxm8qlomq._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1uaepxm8qlomq._.js");
      case "server/chunks/ssr/_next-internal_server_app_cong-cu_bang-tinh-dam-cuoi_page_actions_0rcd950_jr62w.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_cong-cu_bang-tinh-dam-cuoi_page_actions_0rcd950_jr62w.js");
      case "server/chunks/ssr/components_landing_navbar_tsx_15eulpt1lww58._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_landing_navbar_tsx_15eulpt1lww58._.js");
      case "server/chunks/ssr/components_theme_ProfileMenu_tsx_1lb-rlsqito6g._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_theme_ProfileMenu_tsx_1lb-rlsqito6g._.js");
      case "server/chunks/ssr/components_tools_WeddingCalcClient_tsx_0j-08s1wb6u4t._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_tools_WeddingCalcClient_tsx_0j-08s1wb6u4t._.js");
      case "server/chunks/ssr/components_ui_1mivm4ny_kmnl._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_ui_1mivm4ny_kmnl._.js");
      case "server/chunks/ssr/config_landing_ts_1wc_gmitr30tc._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/config_landing_ts_1wc_gmitr30tc._.js");
      case "server/chunks/ssr/config_tools-copy_ts_0-zuzwlaarqxf._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/config_tools-copy_ts_0-zuzwlaarqxf._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1rsozy7a70ih2.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1rsozy7a70ih2.js");
      case "server/chunks/ssr/[root-of-the-server]__130ocr8qz3emt._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__130ocr8qz3emt._.js");
      case "server/chunks/ssr/_12qanml4ocby-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_12qanml4ocby-._.js");
      case "server/chunks/ssr/_1a-7zyh3511m2._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1a-7zyh3511m2._.js");
      case "server/chunks/ssr/_next-internal_server_app_cong-cu_doi-am-lich_page_actions_1yt4u4qe_0e84.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_cong-cu_doi-am-lich_page_actions_1yt4u4qe_0e84.js");
      case "server/chunks/ssr/components_tools_LunarConverterClient_tsx_0cb-g9qyxy9t4._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_tools_LunarConverterClient_tsx_0cb-g9qyxy9t4._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_calendar_1tnuk-zjx7h-1.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_calendar_1tnuk-zjx7h-1.js");
      case "server/chunks/ssr/node_modules_next_dist_06x2g4gza1nss._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_06x2g4gza1nss._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0gapa13d1153q.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0gapa13d1153q.js");
      case "server/chunks/ssr/[root-of-the-server]__1x3chvbna5wj5._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1x3chvbna5wj5._.js");
      case "server/chunks/ssr/_next-internal_server_app_cong-cu_du-tru-chi-phi_page_actions_0somzhs7-ne_y.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_cong-cu_du-tru-chi-phi_page_actions_0somzhs7-ne_y.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1uxtsya8rm_yc.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1uxtsya8rm_yc.js");
      case "server/chunks/ssr/[root-of-the-server]__13zw_capl60_o._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__13zw_capl60_o._.js");
      case "server/chunks/ssr/_next-internal_server_app_cong-cu_page_actions_0lxtmb53goxem.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_cong-cu_page_actions_0lxtmb53goxem.js");
      case "server/chunks/ssr/app_cong-cu_page_tsx_1y0uefd2x1sqb._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/app_cong-cu_page_tsx_1y0uefd2x1sqb._.js");
      case "server/chunks/ssr/lib_utils_ts_0_f1xvmr1rdq_._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/lib_utils_ts_0_f1xvmr1rdq_._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1jj71lrr44v28.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1jj71lrr44v28.js");
      case "server/chunks/ssr/[externals]_crypto_0t4n_9nyaoee1._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_crypto_0t4n_9nyaoee1._.js");
      case "server/chunks/ssr/[root-of-the-server]__07kxqf5csr2q9._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__07kxqf5csr2q9._.js");
      case "server/chunks/ssr/[root-of-the-server]__17la5f6_kcb0c._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__17la5f6_kcb0c._.js");
      case "server/chunks/ssr/_0_lxam92z9_uk._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0_lxam92z9_uk._.js");
      case "server/chunks/ssr/_0nypax8gqvfj4._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0nypax8gqvfj4._.js");
      case "server/chunks/ssr/_1jb_4sq9uja5b._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1jb_4sq9uja5b._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_new_page_actions_0ixgatx7l-sl2.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_new_page_actions_0ixgatx7l-sl2.js");
      case "server/chunks/ssr/components_dashboard_DashboardShell_tsx_1qf63xgsyqhtr._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_dashboard_DashboardShell_tsx_1qf63xgsyqhtr._.js");
      case "server/chunks/ssr/components_dashboard_WeddingList_tsx_1bnyz4rl0bapy._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_dashboard_WeddingList_tsx_1bnyz4rl0bapy._.js");
      case "server/chunks/ssr/lib_auth0_ts_15c0mm2rbjg0o._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/lib_auth0_ts_15c0mm2rbjg0o._.js");
      case "server/chunks/ssr/node_modules_0yewbs6a57djg._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0yewbs6a57djg._.js");
      case "server/chunks/ssr/node_modules_@auth0_nextjs-auth0_dist_utils_constants_0t3fjlyhn62s7.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@auth0_nextjs-auth0_dist_utils_constants_0t3fjlyhn62s7.js");
      case "server/chunks/ssr/node_modules_@auth0_nextjs-auth0_dist_utils_dpopUtils_1642dm3v5brs4.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@auth0_nextjs-auth0_dist_utils_dpopUtils_1642dm3v5brs4.js");
      case "server/chunks/ssr/node_modules_next_0ku34k-r1lkdw._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_0ku34k-r1lkdw._.js");
      case "server/chunks/ssr/node_modules_next_0rza_z_ytwk-v._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_0rza_z_ytwk-v._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0rho6ycha_96w.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0rho6ycha_96w.js");
      case "server/chunks/ssr/templates_registry_ts_1vw8jc3697o9w._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_registry_ts_1vw8jc3697o9w._.js");
      case "server/chunks/ssr/[root-of-the-server]__19nltu8nxkejn._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__19nltu8nxkejn._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_page_actions_10dr1c56aj99-.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_page_actions_10dr1c56aj99-.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0aimdnkdhp_j3.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0aimdnkdhp_j3.js");
      case "server/chunks/ssr/1daa_framer-motion_dist_es_components_AnimatePresence_index_mjs_0nqkepol3prsn._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/1daa_framer-motion_dist_es_components_AnimatePresence_index_mjs_0nqkepol3prsn._.js");
      case "server/chunks/ssr/[root-of-the-server]__00f97glp666v6._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__00f97glp666v6._.js");
      case "server/chunks/ssr/_005u5b2bhrz7d._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_005u5b2bhrz7d._.js");
      case "server/chunks/ssr/_0uvkm8_5fsrtn._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0uvkm8_5fsrtn._.js");
      case "server/chunks/ssr/_10s_1_w2_39eh._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_10s_1_w2_39eh._.js");
      case "server/chunks/ssr/_16h7t5vsgpbr7._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_16h7t5vsgpbr7._.js");
      case "server/chunks/ssr/_1p1paxihv8bwo._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1p1paxihv8bwo._.js");
      case "server/chunks/ssr/_1uzaitezxm8ov._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1uzaitezxm8ov._.js");
      case "server/chunks/ssr/_1v1nz7u5n82uf._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1v1nz7u5n82uf._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_weddings_[id]_page_actions_1i5a64n114_w3.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_weddings_[id]_page_actions_1i5a64n114_w3.js");
      case "server/chunks/ssr/components_dashboard_WeddingDetailView_tsx_1al-fao8sjajt._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_dashboard_WeddingDetailView_tsx_1al-fao8sjajt._.js");
      case "server/chunks/ssr/components_dashboard_WeddingInfoEditor_tsx_0k68uf_vtpnz5._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_dashboard_WeddingInfoEditor_tsx_0k68uf_vtpnz5._.js");
      case "server/chunks/ssr/lib_wedding-data_ts_0ty24nrbsjmyh._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/lib_wedding-data_ts_0ty24nrbsjmyh._.js");
      case "server/chunks/ssr/lib_wedding-types_ts_1tn1t0e12jvu-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/lib_wedding-types_ts_1tn1t0e12jvu-._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_17q2-o_o7scdi._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_17q2-o_o7scdi._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1kh2s1hdirqkw._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1kh2s1hdirqkw._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1zxj5wk44szq-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1zxj5wk44szq-._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_map-pin_1nr3i72q_8nvo.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_map-pin_1nr3i72q_8nvo.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_21bvd9mo_meez.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_21bvd9mo_meez.js");
      case "server/chunks/ssr/templates_1-vh_3z5i86x7._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_1-vh_3z5i86x7._.js");
      case "server/chunks/ssr/templates_basic-1_index_tsx_0ic9027joyjra._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_basic-1_index_tsx_0ic9027joyjra._.js");
      case "server/chunks/ssr/templates_basic-2_index_tsx_07i0jgt--2naz._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_basic-2_index_tsx_07i0jgt--2naz._.js");
      case "server/chunks/ssr/templates_basic-3_index_tsx_1ii1gnwcl02tb._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_basic-3_index_tsx_1ii1gnwcl02tb._.js");
      case "server/chunks/ssr/templates_pro-1_index_tsx_1_lehqg6rvbej._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_pro-1_index_tsx_1_lehqg6rvbej._.js");
      case "server/chunks/ssr/_1dutidt4d7k19._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1dutidt4d7k19._.js");
      case "server/chunks/ssr/_next-internal_server_app_dieu-khoan-su-dung_page_actions_20j-cb2k4pzap.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dieu-khoan-su-dung_page_actions_20j-cb2k4pzap.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_16h16zpgsyv63.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_16h16zpgsyv63.js");
      case "server/chunks/ssr/_1_rhun9mwvnd1._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1_rhun9mwvnd1._.js");
      case "server/chunks/ssr/_1f8cydffwz2rb._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1f8cydffwz2rb._.js");
      case "server/chunks/ssr/_1r77nmi-0s1sm._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1r77nmi-0s1sm._.js");
      case "server/chunks/ssr/_next-internal_server_app_m_[slug]_page_actions_11ocoiaiwpqzf.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_m_[slug]_page_actions_11ocoiaiwpqzf.js");
      case "server/chunks/ssr/components_invitation_InvitePageClient_tsx_047o1dg-lh86u._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_invitation_InvitePageClient_tsx_047o1dg-lh86u._.js");
      case "server/chunks/ssr/lib_server_public-wedding_ts_1edm7-mvmr73f._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/lib_server_public-wedding_ts_1edm7-mvmr73f._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0ry55bayi0ixq._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0ry55bayi0ixq._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0wqzx65xxfoqt._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0wqzx65xxfoqt._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_calendar-heart_0mzouyapmboui.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_calendar-heart_0mzouyapmboui.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_diamond_04x4yu7o13pvp.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_diamond_04x4yu7o13pvp.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qk-ux3vb-yww.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qk-ux3vb-yww.js");
      case "server/chunks/ssr/templates_basic-1_index_tsx_0x-jusn0sicmq._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_basic-1_index_tsx_0x-jusn0sicmq._.js");
      case "server/chunks/ssr/[externals]_crypto_0a3pt2hpc9gzb._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_crypto_0a3pt2hpc9gzb._.js");
      case "server/chunks/ssr/[root-of-the-server]__0-e55b-juouqz._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0-e55b-juouqz._.js");
      case "server/chunks/ssr/_0c1rfobwe5nc0._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0c1rfobwe5nc0._.js");
      case "server/chunks/ssr/_0ifvrej1avgk3._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0ifvrej1avgk3._.js");
      case "server/chunks/ssr/_13vs80bvko8s-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_13vs80bvko8s-._.js");
      case "server/chunks/ssr/_1frho373z-tvd._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1frho373z-tvd._.js");
      case "server/chunks/ssr/_1gluegpiv_o_3._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1gluegpiv_o_3._.js");
      case "server/chunks/ssr/_next-internal_server_app_mau_[templateId]_page_actions_1fowvs21o-yn3.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_mau_[templateId]_page_actions_1fowvs21o-yn3.js");
      case "server/chunks/ssr/components_demo_template-demo-viewer_tsx_0qu4rc9l0_5k0._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_demo_template-demo-viewer_tsx_0qu4rc9l0_5k0._.js");
      case "server/chunks/ssr/node_modules_@swc_helpers_cjs__interop_require_wildcard_cjs_07s0qsy3bzggy._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@swc_helpers_cjs__interop_require_wildcard_cjs_07s0qsy3bzggy._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_16895fiv6voty._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_16895fiv6voty._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1aa_7lhctvfc_._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1aa_7lhctvfc_._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1dqjcxv0h810p._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1dqjcxv0h810p._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qni2958cu-ci.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qni2958cu-ci.js");
      case "server/chunks/_1rgtxlk588v60._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1rgtxlk588v60._.js");
      case "server/chunks/_next-internal_server_app_media_[___key]_route_actions_0hf8z0m2136tw.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_media_[___key]_route_actions_0hf8z0m2136tw.js");
      case "server/chunks/ssr/[externals]_crypto_0tv9xa3pmn2yq._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_crypto_0tv9xa3pmn2yq._.js");
      case "server/chunks/ssr/[root-of-the-server]__1o6lrnb_a3y4s._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1o6lrnb_a3y4s._.js");
      case "server/chunks/ssr/_1es-aafqq2_dy._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1es-aafqq2_dy._.js");
      case "server/chunks/ssr/_1jlm-6tjj3t9f._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1jlm-6tjj3t9f._.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1jew5ls7.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1jew5ls7.js");
      case "server/chunks/ssr/components_landing_footer_tsx_0mskg5cb1nzky._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_landing_footer_tsx_0mskg5cb1nzky._.js");
      case "server/chunks/ssr/components_landing_landing-page-client_tsx_09jgkfcpeftcb._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_landing_landing-page-client_tsx_09jgkfcpeftcb._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_009uvwydgw52_._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_009uvwydgw52_._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0g_fcsj7wihnh._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0g_fcsj7wihnh._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0ie00wyen0byi._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0ie00wyen0byi._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1xx-losad-704._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1xx-losad-704._.js");
      case "server/chunks/ssr/node_modules_next_dist_1bjw1z_4tnif_._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1bjw1z_4tnif_._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1nazowj1bdbgt.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1nazowj1bdbgt.js");
      case "server/chunks/ssr/templates_1a8mz69jv1atg._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_1a8mz69jv1atg._.js");
      case "server/chunks/_077h4j44jalm5._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_077h4j44jalm5._.js");
      case "server/chunks/_211voqeezkggc._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_211voqeezkggc._.js");
      case "server/chunks/_next-internal_server_app_robots_txt_route_actions_15vc_89wprgh5.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_robots_txt_route_actions_15vc_89wprgh5.js");
      case "server/chunks/_1tpdjxmbuvj7w._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_1tpdjxmbuvj7w._.js");
      case "server/chunks/_next-internal_server_app_sitemap_xml_route_actions_05l5km9x9dlo2.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_sitemap_xml_route_actions_05l5km9x9dlo2.js");
      case "server/chunks/ssr/[externals]_crypto_0pxwplc7sh56o._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_crypto_0pxwplc7sh56o._.js");
      case "server/chunks/ssr/[root-of-the-server]__1vz4wm52zg47c._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1vz4wm52zg47c._.js");
      case "server/chunks/ssr/_1-4krvr1vta24._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_1-4krvr1vta24._.js");
      case "server/chunks/ssr/_next-internal_server_app_tao-thiep_luu_page_actions_14ulz9c_80ghd.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_tao-thiep_luu_page_actions_14ulz9c_80ghd.js");
      case "server/chunks/ssr/components_create_SaveDraftPageClient_tsx_1gp6bzugtol66._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_create_SaveDraftPageClient_tsx_1gp6bzugtol66._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_arrow-left_1z7m2bkol7rga.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_arrow-left_1z7m2bkol7rga.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1q4lla6adkk51.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1q4lla6adkk51.js");
      case "server/chunks/ssr/[externals]_crypto_1w6pk5j-usv2r._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_crypto_1w6pk5j-usv2r._.js");
      case "server/chunks/ssr/[root-of-the-server]__03wsy0eij-j0t._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__03wsy0eij-j0t._.js");
      case "server/chunks/ssr/_0gc75hf3upnd2._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0gc75hf3upnd2._.js");
      case "server/chunks/ssr/_0hyyyz353q9rl._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_0hyyyz353q9rl._.js");
      case "server/chunks/ssr/_122t5yl96pf0d._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_122t5yl96pf0d._.js");
      case "server/chunks/ssr/_next-internal_server_app_tao-thiep_page_actions_15rafg7l8hgx3.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_tao-thiep_page_actions_15rafg7l8hgx3.js");
      case "server/chunks/ssr/components_create_CreateWeddingBuilder_tsx_0rhki4-cbjgf0._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/components_create_CreateWeddingBuilder_tsx_0rhki4-cbjgf0._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_00d2zmvh6zzj1._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_00d2zmvh6zzj1._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_11j0qz_b7r9e-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_11j0qz_b7r9e-._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_heart_1c10dpjtl_uf0.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_heart_1c10dpjtl_uf0.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ayegn71fmz_0.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ayegn71fmz_0.js");
      case "server/chunks/ssr/templates_0m130or8lp8_-._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/templates_0m130or8lp8_-._.js");
      case "server/chunks/ssr/_12fbfzmv5bwj1._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_12fbfzmv5bwj1._.js");
      case "server/chunks/ssr/_20vw19c7tppei._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_20vw19c7tppei._.js");
      case "server/chunks/ssr/_next-internal_server_app_w_[slug]_page_actions_1kzhp74pfgx1q.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_w_[slug]_page_actions_1kzhp74pfgx1q.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1piw1e5czy0f1.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1piw1e5czy0f1.js");
      case "server/chunks/ssr/[root-of-the-server]__0py1t7q9ntzgc._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0py1t7q9ntzgc._.js");
      case "server/chunks/ssr/[root-of-the-server]__1dxp8b4r0tusm._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1dxp8b4r0tusm._.js");
      case "server/chunks/ssr/[root-of-the-server]__1vwegr-t8j6qe._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1vwegr-t8j6qe._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-psc_d2.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-psc_d2.js");
      case "server/chunks/ssr/node_modules_0gxlxpuufujz9._.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0gxlxpuufujz9._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_19--w_z4y02i7.js": return require("C:/Users/thuan.ton/Desktop/wedding_invi_web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_19--w_z4y02i7.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
