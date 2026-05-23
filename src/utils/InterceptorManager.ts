import {
  RequestInterceptor,
  ResponseInterceptor,
  RequestBodyData,
} from "../types/interceptors.js";

/**
 * @class InterceptorManager
 * @ru Управляет регистрацией и последовательным выполнением перехватчиков запроса и ответа.
 */
export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * @ru Добавляет перехватчик запроса в цепочку.
   */
  addRequest(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * @ru Добавляет перехватчик ответа в цепочку.
   */
  addResponse(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * @ru Последовательно применяет все перехватчики к конфигурации запроса.
   */
  async applyRequest(config: {
    url: string;
    method: string;
    headers: Record<string, string | string[]>;
    body?: RequestBodyData;
  }) {
    if (this.requestInterceptors.length === 0) return config;
    let result = config;

    for (const interceptor of this.requestInterceptors) {
      const nextConfig = await interceptor(result);
      if (nextConfig) {
        result = nextConfig;
      }
    }

    return result;
  }

  /**
   * @ru Последовательно применяет все перехватчики к ответу.
   */
  async applyResponse(response: {
    status: number;
    headers: Record<string, string | string[]>;
    body: any;
    url: string;
  }) {
    if (this.responseInterceptors.length === 0) return response;
    let result = response;

    for (const interceptor of this.responseInterceptors) {
      const nextResponse = await interceptor(result);
      if (nextResponse) {
        result = nextResponse;
      }
    }

    return result;
  }

  /**
   * @ru Очищает все зарегистрированные перехватчики.
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
}
