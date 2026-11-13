module.exports=[24515,t=>{"use strict";let e=Symbol.for("__cloudflare-context__");function n(){return globalThis[e]}async function a(){let t=n();if(t)return t;{var a;let t=await o();return a=t,globalThis[e]=a,t}}async function o(t){let{getPlatformProxy:e}=await import(`${"__wrangler".replaceAll("_","")}`),n=t?.environment??process.env.NEXT_DEV_WRANGLER_ENV,{env:a,cf:o,ctx:r}=await e({...t,envFiles:[],environment:n});return{env:a,cf:o,ctx:r}}let r=`

ERROR: \`getCloudflareContext\` has been called without having called \`initOpenNextCloudflareForDev\` from the Next.js config file.
You should update your Next.js config file as shown below:

   \`\`\`
   // next.config.mjs

   import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

   initOpenNextCloudflareForDev();

   const nextConfig = { ... };
   export default nextConfig;
   \`\`\`

`,l=/^weddings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(banner|couple|gallery|og|gift)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;function i(t){return l.test(t)}function u(t){return t.length<12?null:255===t[0]&&216===t[1]&&255===t[2]?"image/jpeg":137===t[0]&&80===t[1]&&78===t[2]&&71===t[3]&&13===t[4]&&10===t[5]&&26===t[6]&&10===t[7]?"image/png":82===t[0]&&73===t[1]&&70===t[2]&&70===t[3]&&87===t[8]&&69===t[9]&&66===t[10]&&80===t[11]?"image/webp":null}async function c(){let{env:t}=await function(t={async:!1}){return t.async?a():function(){let t,e=n();if(e)return e;if(t=globalThis,t.__NEXT_DATA__?.nextExport===!0)throw Error("\n\nERROR: `getCloudflareContext` has been called in sync mode in either a static route or at the top level of a non-static one, both cases are not allowed but can be solved by either:\n  - make sure that the call is not at the top level and that the route is not static\n  - call `getCloudflareContext({async: true})` to use the `async` mode\n  - avoid calling `getCloudflareContext` in the route\n");throw Error(r)}()}({async:!0}),e=t.PHOTOS;if(!e)throw Error("R2 bucket binding PHOTOS chưa được cấu hình.");return e}async function f(t,e,n){let a=await c();await a.put(t,e,{httpMetadata:{contentType:n}})}async function s(t){if(!i(t))return null;let e=await c(),n=await e.get(t);if(!n)return null;let a=new Uint8Array(await n.arrayBuffer()),o=n.httpMetadata?.contentType||u(a)||"image/webp";return{bytes:a,contentType:o}}async function d(t){if(!t)return;let e=await c();await e.delete(t)}t.s(["c",0,function(t){return`/media/${t}`},"H",0,function(t,e){return`weddings/${t}/${e}/${crypto.randomUUID()}.webp`},"p",0,d,"P",0,u,"v",0,s,"D",0,i,"f",0,f],24515)}];

//# sourceMappingURL=lib_server_storage_ts_0mqj3vt0frzd7._.js.map