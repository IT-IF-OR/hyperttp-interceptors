import type {
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
  HttpResponse,
  PluginContext,
} from "@hyperttp/types";
import { InterceptorManager } from "./utils/InterceptorManager.js";
import type { InterceptorOptions } from "./types/interceptors.js";

/**
 * @en Extends PluginContext to include the interceptor manager instance.
 * @ru Расширяет PluginContext, добавляя экземпляр менеджера интерцепторов.
 */
declare module "@hyperttp/types" {
  interface PluginContext {
    /**
     * @en The active interceptor manager instance.
     * @ru Активный экземпляр менеджера интерцепторов.
     */
    interceptors?: InterceptorManager;
  }

  /**
   * @en Extends HttpClientOptions to include interceptor configuration.
   * @ru Расширяет HttpClientOptions, добавляя конфигурацию интерцепторов.
   */
  interface HttpClientOptions {
    /**
     * @en Interceptor plugin configuration options.
     * @ru Опции конфигурации плагина интерцепторов.
     */
    interceptors?: InterceptorOptions;
  }
}

/**
 * @en Plugin for integrating custom request and response interceptors (Axios-like Interceptors).
 * @ru Плагин для интеграции кастомных интерцепторов запросов и ответов (Axios-like Interceptors).
 * @returns HyperPlugin object instance.
 */
export function withInterceptors(): HyperPlugin {
  let manager: InterceptorManager;

  return {
    name: "hyperttp-interceptors",

    /**
     * @en Evaluates plugin activation based on the provided client configuration.
     * @ru Проверяет активацию плагина на основе переданной конфигурации.
     * @param config - The current client configuration.
     * @returns True if interceptors are enabled.
     */
    enabled: (config: HttpClientOptions): boolean =>
      !!config.interceptors?.enabled,

    /**
     * @en Initialization hook. Creates the interceptor manager and registers it within the core context.
     * @ru Хук инициализации. Создает менеджер интерцепторов и регистрирует его в контексте ядра.
     * @param ctx - Shared plugin orchestration context.
     */
    setup(ctx: PluginContext): void {
      manager = new InterceptorManager();
      ctx.interceptors = manager;
    },

    /**
     * @en Request phase interceptor hook. Sequentially applies all registered interceptors to the request configuration.
     * @ru Перехватчик фазы запроса. Последовательно применяет все зарегистрированные интерцепторы к конфигурации запроса.
     * @param req - Contextual internal request parameters.
     */
    async onRequest(req: InternalRequest): Promise<void> {
      if (!manager.hasRequest) return;

      const reqResult = await manager.applyRequest(req);
      if (reqResult) {
        Object.assign(req, reqResult);
      }
    },

    /**
     * @en Response phase interceptor hook. Passes the response object through the chain of custom modification interceptors.
     * @ru Перехватчик фазы успешного ответа. Пропускает объект ответа через цепочку пользовательских интерцепторов модификации.
     * @param res - Output HTTP client response reference.
     * @param req - Contextual internal request parameters.
     */
    async onResponse(res: HttpResponse<any>): Promise<void> {
      if (!manager.hasResponse) return;

      const resResult = await manager.applyResponse(res);
      if (resResult) {
        Object.assign(res, resResult);
      }
    },
  };
}
