import type {
  HyperCore,
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
} from "@hyperttp/core";
import { InterceptorManager } from "./utils/InterceptorManager.js";

interface InterceptorHyperCore extends HyperCore {
  interceptors?: InterceptorManager;
}

export type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "OPTIONS"
  | "DELETE"
  | "HEAD";

export function withInterceptors(client: HyperCore): InterceptorHyperCore {
  const manager = new InterceptorManager();
  const originalDispatch = client.dispatch;

  client.dispatch = async <T>(req: InternalRequest): Promise<T> => {
    const requestUrl = typeof req.url === "string" ? req.url : req.url.getURL();

    const modifiedReq = await manager.applyRequest({
      url: requestUrl,
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    const response = await originalDispatch({
      ...req,
      ...modifiedReq,
      method: (modifiedReq.method ?? req.method) as Method,
    });

    const interceptedResponse = await manager.applyResponse({
      status: response.status,
      headers: response.headers,
      body: response.body,
      url: response.url ?? requestUrl,
    });

    return interceptedResponse as T;
  };

  const extended = client as InterceptorHyperCore;
  extended.interceptors = manager;
  return extended;
}

declare module "@hyperttp/core" {
  interface HyperttpPluginsExtension {
    interceptors?: { enabled: boolean };
  }
}

export const InterceptorsPlugin: HyperPlugin = {
  name: "hyperttp-interceptors",
  phase: "PREPARE",
  enabled: (config: HttpClientOptions) => !!config.interceptors?.enabled,
  apply: (client: HyperCore) => withInterceptors(client),
};
