import type {
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
  HttpResponse,
} from "@hyperttp/core";
import { InterceptorManager } from "./utils/InterceptorManager.js";

export type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "OPTIONS"
  | "DELETE"
  | "HEAD";

declare module "@hyperttp/core" {
  interface HyperCore {
    interceptors?: InterceptorManager;
  }

  interface HyperttpPluginsExtension {
    interceptors?: { enabled?: boolean };
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
      return async <T>(req: InternalRequest): Promise<HttpResponse<T>> => {
        const modifiedReqData = await manager.applyRequest({
          url: req.url,
          method: req.method,
          headers: req.headers,
          body: req.body,
        });

        const finalReq: InternalRequest = {
          ...req,
          ...modifiedReqData,
          method: (modifiedReqData.method ?? req.method) as Method,
        };

        const response = await next<T>(finalReq);

        const interceptedResponseData = await manager.applyResponse({
          status: response.status,
          headers: response.headers,
          body: response.body,
          url: response.url ?? req.url,
        });

        return {
          ...response,
          ...interceptedResponseData,
        };
      };
    },
  };
}
