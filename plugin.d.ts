import type { HyperPlugin } from "@hyperttp/types";
import { InterceptorManager } from "./utils/InterceptorManager.js";
import type { InterceptorOptions } from "./types/interceptors.js";
declare module "@hyperttp/types" {
    interface HyperClientOptions {
        interceptors?: InterceptorOptions;
    }
    interface PluginContext {
        interceptors?: InterceptorManager;
    }
}
export declare function withInterceptors(options?: InterceptorOptions): HyperPlugin;
//# sourceMappingURL=plugin.d.ts.map