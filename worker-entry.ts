// Custom Worker entry: giữ nguyên handler của OpenNext và thêm cron dọn dữ liệu
// hết hạn (gói free quá 30 ngày). Xem wrangler.jsonc -> triggers.crons.
// File này do Wrangler bundle (không thuộc build của Next) nên được loại khỏi
// tsconfig/eslint; kiểm tra bằng `wrangler deploy --dry-run`.
import openNextWorker from "./.open-next/worker.js";
import { purgeExpiredFreeWeddings } from "./lib/server/retention.ts";

export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

export default {
  fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      purgeExpiredFreeWeddings({
        deleteObject: (key) => env.PHOTOS.delete(key),
      }).catch((error) => {
        console.error("[retention] purge failed", error);
      }),
    );
  },
};
