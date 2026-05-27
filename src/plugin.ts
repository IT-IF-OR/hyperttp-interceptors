import type {
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
  HttpResponse,
  PluginContext,
} from "@hyperttp/types";
import { InterceptorManager } from "./utils/InterceptorManager.js";
import type { InterceptorOptions } from "./types/interceptors.js";

declare module "@hyperttp/types" {
  interface PluginContext {
    interceptors?: InterceptorManager;
  }

  interface HttpClientOptions {
    interceptors?: InterceptorOptions;
  }
}

/**
 * @ru Плагин для интеграции кастомных интерцепторов запросов и ответов (Axios-like Interceptors).
 * @en Plugin for integrating custom request and response interceptors (Axios-like Interceptors).
 * @returns HyperPlugin object instance.
 */
export function withInterceptors(): HyperPlugin {
  let manager: InterceptorManager;

  return {
    name: "hyperttp-interceptors",

    /**
     * @ru Проверяет активацию плагина на основе переданной конфигурации.
     * @en Evaluates plugin activation based on the provided client configuration.
     */
    enabled: (config: HttpClientOptions): boolean =>
      !!config.interceptors?.enabled,

    /**
     * @ru Хук инициализации. Создает менеджер интерцепторов и регистрирует его в контексте ядра.
     * @en Initialization hook. Creates the interceptor manager and registers it within the core context.
     * @param core - Shared plugin orchestration context.
     */
    setup(core: PluginContext): void {
      manager = new InterceptorManager();
      core.interceptors = manager;
    },

    /**
     * @ru Перехватчик фазы запроса. Последовательно применяет все зарегистрированные интерцепторы к конфигурации запроса.
     * @en Request phase interceptor hook. Sequentially applies all registered interceptors to the request configuration.
     * @param req - Contextual internal request parameters.
     */
    async onRequest(req: InternalRequest): Promise<void> {
      if (!manager.hasRequest) return;

      const reqResult = await manager.applyRequest(req);
      if (reqResult) {
        // Накатываем изменения на текущую ссылку запроса, если интерцептор вернул обновленный объект
        Object.assign(req, reqResult);
      }
    },

    /**
     * @ru Перехватчик фазы успешного ответа. Пропускает объект ответа через цепочку пользовательских интерцепторов модификации.
     * @en Response phase interceptor hook. Passes the response object through the chain of custom modification interceptors.
     * @param res - Output HTTP client response reference.
     * @param req - Contextual internal request parameters.
     */
    async onResponse(
      res: HttpResponse<any>,
      req: InternalRequest,
    ): Promise<void> {
      if (!manager.hasResponse) return;

      const resResult = await manager.applyResponse(res);
      if (resResult) {
        // Мутируем объект ответа перед передачей в пользовательский код
        Object.assign(res, resResult);
      }
    },
  };
}
