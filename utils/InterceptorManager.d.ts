import type { PluginContext, RequestContext, SendRequest, UniversalResponse } from "@hyperttp/types";
import type { RequestInterceptor, ResponseInterceptor } from "../types/interceptors.js";
export declare class InterceptorManager {
    private requestInterceptors;
    private responseInterceptors;
    hasRequest: boolean;
    hasResponse: boolean;
    addRequest(interceptor: RequestInterceptor): void;
    addResponse(interceptor: ResponseInterceptor): void;
    applyRequest(request: SendRequest, context?: PluginContext, requestContext?: RequestContext): SendRequest | Promise<SendRequest>;
    private applyRequestAsync;
    applyResponse(response: UniversalResponse, request?: SendRequest, context?: PluginContext, requestContext?: RequestContext): UniversalResponse | Promise<UniversalResponse>;
    private applyResponseAsync;
    clear(): void;
}
//# sourceMappingURL=InterceptorManager.d.ts.map