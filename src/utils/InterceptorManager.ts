import { InternalRequest, HttpResponse } from "@hyperttp/types";
import {
  RequestInterceptor,
  ResponseInterceptor,
} from "../types/interceptors.js";

/**
 * @ru Менеджер перехватчиков (интерцепторов) для сквозной обработки запросов и ответов.
 * Использует гибридный цикл (fast-path): выполняется синхронно до тех пор, пока не встретит Promise.
 * @en Interceptor manager for pipeline execution of requests and responses.
 * Uses a hybrid loop (fast-path): runs synchronously until a Promise is encountered.
 */
export class InterceptorManager {
  /**
   * @private
   * @ru Массив зарегистрированных перехватчиков запроса.
   * @en Array of registered request interceptors.
   */
  private requestInterceptors: RequestInterceptor[] = [];

  /**
   * @private
   * @ru Массив зарегистрированных перехватчиков ответа.
   * @en Array of registered response interceptors.
   */
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * @ru Флаг наличия активных перехватчиков запроса для быстрого ветвления.
   * @en Flag indicating presence of active request interceptors for fast branch short-circuiting.
   */
  public hasRequest = false;

  /**
   * @ru Флаг наличия активных перехватчиков ответа для быстрого ветвления.
   * @en Flag indicating presence of active response interceptors for fast branch short-circuiting.
   */
  public hasResponse = false;

  /**
   * @ru Регистрирует новый перехватчик запроса в конвейере.
   * @en Registers a new request interceptor in the pipeline.
   * @param interceptor - Target request interceptor function.
   */
  addRequest(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    this.hasRequest = true;
  }

  /**
   * @ru Регистрирует новый перехватчик ответа в конвейере.
   * @en Registers a new response interceptor in the pipeline.
   * @param interceptor - Target response interceptor function.
   */
  addResponse(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    this.hasResponse = true;
  }

  /**
   * @ru Последовательно применяет цепочку перехватчиков к конфигурации запроса.
   * @en Sequentially applies the chain of interceptors to the request configuration.
   * @param config - Initial internal request configuration object.
   * @returns Modified configuration or a Promise resolving to it.
   */
  applyRequest(
    config: InternalRequest,
  ): InternalRequest | Promise<InternalRequest> {
    let result = config;
    const len = this.requestInterceptors.length;

    for (let i = 0; i < len; i++) {
      const nextConfig = this.requestInterceptors[i](result);

      if (nextConfig instanceof Promise) {
        return this.applyRequestAsync(i, nextConfig, result);
      }

      if (nextConfig) result = nextConfig;
    }
    return result;
  }

  /**
   * @private
   * @ru Асинхронный фолбек для обработки оставшейся цепочки запросов после обнаружения Promise.
   * @en Asynchronous fallback to process the remaining request chain after encountering a Promise.
   * @param startIndex - Index of the interceptor that returned a Promise.
   * @param currentPromise - The pending Promise from the current interceptor step.
   * @param currentResult - Cumulative configuration result before the Promise step.
   */
  private async applyRequestAsync(
    startIndex: number,
    currentPromise: Promise<InternalRequest | void>,
    currentResult: InternalRequest,
  ): Promise<InternalRequest> {
    let result = currentResult;

    const resolved = await currentPromise;
    if (resolved) result = resolved;

    const len = this.requestInterceptors.length;
    for (let i = startIndex + 1; i < len; i++) {
      const nextConfig = this.requestInterceptors[i](result);
      if (nextConfig instanceof Promise) {
        const res = await nextConfig;
        if (res) result = res;
      } else if (nextConfig) {
        result = nextConfig;
      }
    }
    return result;
  }

  /**
   * @ru Последовательно применяет цепочку перехватчиков к полученному объекту ответа.
   * @en Sequentially applies the chain of interceptors to the incoming response container.
   * @template T - Type mapping descriptor for the expected response payload body.
   * @param response - Target HTTP response context wrapper.
   * @returns Transformed response context or a Promise resolving to it.
   */
  applyResponse<T = unknown>(
    response: HttpResponse<T>,
  ): HttpResponse<T> | Promise<HttpResponse<T>> {
    let result = response;
    const len = this.responseInterceptors.length;

    for (let i = 0; i < len; i++) {
      const nextResponse = this.responseInterceptors[i](result);

      if (nextResponse instanceof Promise) {
        return this.applyResponseAsync<T>(i, nextResponse, result);
      }

      if (nextResponse) result = nextResponse as HttpResponse<T>;
    }
    return result;
  }

  /**
   * @private
   * @ru Асинхронный фолбек для обработки оставшейся цепочки ответов после обнаружения Promise.
   * @en Asynchronous fallback to process the remaining response chain after encountering a Promise.
   * @template T - Type mapping descriptor for the expected response payload body.
   * @param startIndex - Index of the interceptor that returned a Promise.
   * @param currentPromise - The pending Promise from the current interceptor step.
   * @param currentResult - Cumulative response result before the Promise step.
   */
  private async applyResponseAsync<T>(
    startIndex: number,
    currentPromise: Promise<HttpResponse<T> | void>,
    currentResult: HttpResponse<T>,
  ): Promise<HttpResponse<T>> {
    let result = currentResult;
    const resolved = await currentPromise;
    if (resolved) result = resolved;

    const len = this.responseInterceptors.length;
    for (let i = startIndex + 1; i < len; i++) {
      const nextResponse = this.responseInterceptors[i](result);
      if (nextResponse instanceof Promise) {
        const res = await nextResponse;
        if (res) result = res as HttpResponse<T>;
      } else if (nextResponse) {
        result = nextResponse as HttpResponse<T>;
      }
    }
    return result;
  }

  /**
   * @ru Полностью очищает списки зарегистрированных перехватчиков и сбрасывает флаги.
   * @en Completely flushes internal interceptor registers and resets state indicators.
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.hasRequest = false;
    this.hasResponse = false;
  }
}
