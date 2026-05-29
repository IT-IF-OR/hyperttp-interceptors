import { InternalRequest, HttpResponse } from "@hyperttp/types";
import {
  RequestInterceptor,
  ResponseInterceptor,
} from "../types/interceptors.js";

/**
 * @en Interceptor manager for pipeline execution of requests and responses.
 * Uses a hybrid loop (fast-path): runs synchronously until a Promise is encountered.
 * @ru Менеджер перехватчиков (интерцепторов) для сквозной обработки запросов и ответов.
 * Использует гибридный цикл (fast-path): выполняется синхронно до тех пор, пока не встретит Promise.
 */
export class InterceptorManager {
  /**
   * @en Array of registered request interceptors.
   * @ru Массив зарегистрированных перехватчиков запроса.
   * @private
   */
  private requestInterceptors: RequestInterceptor[] = [];

  /**
   * @en Array of registered response interceptors.
   * @ru Массив зарегистрированных перехватчиков ответа.
   * @private
   */
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * @en Flag indicating presence of active request interceptors for fast branch short-circuiting.
   * @ru Флаг наличия активных перехватчиков запроса для быстрого ветвления.
   */
  public hasRequest = false;

  /**
   * @en Flag indicating presence of active response interceptors for fast branch short-circuiting.
   * @ru Флаг наличия активных перехватчиков ответа для быстрого ветвления.
   */
  public hasResponse = false;

  /**
   * @en Registers a new request interceptor in the pipeline.
   * @ru Регистрирует новый перехватчик запроса в конвейере.
   * @param interceptor - Target request interceptor function.
   */
  addRequest(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    this.hasRequest = true;
  }

  /**
   * @en Registers a new response interceptor in the pipeline.
   * @ru Регистрирует новый перехватчик ответа в конвейере.
   * @param interceptor - Target response interceptor function.
   */
  addResponse(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    this.hasResponse = true;
  }

  /**
   * @en Sequentially applies the chain of interceptors to the request configuration.
   * @ru Последовательно применяет цепочку перехватчиков к конфигурации запроса.
   * @param config - Initial internal request configuration object.
   * @returns Modified configuration or a Promise resolving to it.
   */
  applyRequest(
    config: InternalRequest,
  ): InternalRequest | Promise<InternalRequest> {
    let result = config;
    for (let i = 0; i < this.requestInterceptors.length; i++) {
      const next = this.requestInterceptors[i](result);

      if (next instanceof Promise) {
        return this.applyRequestAsync(i + 1, next, result);
      }
      if (next) result = next;
    }
    return result;
  }

  /**
   * @en Asynchronous fallback to process the remaining request chain after encountering a Promise.
   * @ru Асинхронный фолбек для обработки оставшейся цепочки запросов после обнаружения Promise.
   * @param startIndex - Index of the interceptor that returned a Promise.
   * @param currentPromise - The pending Promise from the current interceptor step.
   * @param currentResult - Cumulative configuration result before the Promise step.
   * @private
   */
  private async applyRequestAsync(
    startIndex: number,
    currentPromise: Promise<InternalRequest | void>,
    currentResult: InternalRequest,
  ): Promise<InternalRequest> {
    let result = (await currentPromise) ?? currentResult;

    for (let i = startIndex; i < this.requestInterceptors.length; i++) {
      const next = this.requestInterceptors[i](result);
      result = (next instanceof Promise ? await next : next) ?? result;
    }
    return result;
  }

  /**
   * @en Sequentially applies the chain of interceptors to the incoming response container.
   * @ru Последовательно применяет цепочку перехватчиков к полученному объекту ответа.
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
   * @en Asynchronous fallback to process the remaining response chain after encountering a Promise.
   * @ru Асинхронный фолбек для обработки оставшейся цепочки ответов после обнаружения Promise.
   * @template T - Type mapping descriptor for the expected response payload body.
   * @param startIndex - Index of the interceptor that returned a Promise.
   * @param currentPromise - The pending Promise from the current interceptor step.
   * @param currentResult - Cumulative response result before the Promise step.
   * @private
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
   * @en Completely flushes internal interceptor registers and resets state indicators.
   * @ru Полностью очищает списки зарегистрированных перехватчиков и сбрасывает флаги.
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.hasRequest = false;
    this.hasResponse = false;
  }
}
