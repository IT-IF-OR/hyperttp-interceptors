import type {
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
  HttpResponse,
} from "@hyperttp/core";
import { InterceptorManager } from "./utils/InterceptorManager.js";
import type { InterceptorOptions } from "./types/interceptors.js";

export type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "OPTIONS"
  | "DELETE"
  | "HEAD";

declare module "@hyperttp/core" {
  interface PluginContext {
    interceptors?: InterceptorManager;
  }

  interface HttpClientOptions {
    interceptors?: InterceptorOptions;
  }
}

export function withInterceptors(): HyperPlugin {
  let manager: InterceptorManager;

  return {
    name: "hyperttp-interceptors",
    phase: "PREPARE",
    enabled: (config: HttpClientOptions) => !!config.interceptors?.enabled,

    setup(core) {
      manager = new InterceptorManager();
      core.interceptors = manager;
    },

    wrapDispatch: (next) => {
      return <T>(req: InternalRequest): Promise<HttpResponse<T>> => {
        if (!manager.hasRequest && !manager.hasResponse) {
          return next<T>(req);
        }

        const reqResult = manager.applyRequest(req);

        if (reqResult instanceof Promise) {
          return reqResult.then((finalReq) => {
            return next<T>(finalReq || req).then((res) =>
              manager.applyResponse(res),
            );
          });
        }

        return next<T>(reqResult || req).then((res) =>
          manager.applyResponse(res),
        ) as Promise<HttpResponse<T>>;
      };
    },
  };
}
