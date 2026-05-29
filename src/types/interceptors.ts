import type { InternalRequest, HttpResponse } from "@hyperttp/types";

/**
 * @en Configuration options for the interceptors plugin.
 * @ru Опции конфигурации для плагина интерцепторов.
 */
export interface InterceptorOptions {
  /**
   * @en Enable interceptor processing for the client.
   * @ru Включить обработку интерцепторов для клиента.
   */
  enabled?: boolean;
}

/**
 * @en Request interceptor function signature.
 * Accepts the core internal request object. Can return a modified configuration
 * or `void` (if modifications are applied directly to the passed object reference).
 * @ru Перехватчик запроса.
 * Принимает внутренний объект запроса ядра. Может вернуть модифицированный объект
 * или `void` (если изменения вносятся напрямую в переданный объект по ссылке).
 * @param config - The internal request configuration.
 * @returns A modified request object, void, or a Promise resolving to either.
 */
export type RequestInterceptor = (
  config: InternalRequest,
) => InternalRequest | void | Promise<InternalRequest | void>;

/**
 * @en Response interceptor function signature.
 * Accepts a response object with any body layout (`HttpResponse<any>`). Can return
 * a transformed response container or `void` (if the object is mutated in-place).
 * @ru Перехватчик ответа.
 * Принимает объект ответа с любым типом тела (`HttpResponse<any>`). Может вернуть
 * трансформированный объект ответа или `void` (если объект мутирует по ссылке).
 * @param response - The HTTP response object.
 * @returns A modified response object, void, or a Promise resolving to either.
 */
export type ResponseInterceptor = (
  response: HttpResponse<any>,
) => HttpResponse<any> | void | Promise<HttpResponse<any> | void>;
