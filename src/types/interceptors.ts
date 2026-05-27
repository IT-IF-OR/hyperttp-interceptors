import type { InternalRequest, HttpResponse } from "@hyperttp/types";

/**
 * @ru Опции конфигурации для плагина интерцепторов.
 * @en Configuration options for the interceptors plugin.
 */
export interface InterceptorOptions {
  /**
   * @ru Включить обработку интерцепторов для клиента.
   * @en Enable interceptor processing for the client.
   */
  enabled?: boolean;
}

/**
 * @ru Перехватчик запроса.
 * Принимает внутренний объект запроса ядра. Может вернуть модифицированный объект
 * или `void` (если изменения вносятся напрямую в переданный объект по ссылке).
 * * @en Request interceptor.
 * Accepts the core internal request object. Can return a modified configuration
 * or `void` (if modifications are applied directly to the passed object reference).
 */
export type RequestInterceptor = (
  config: InternalRequest,
) => InternalRequest | void | Promise<InternalRequest | void>;

/**
 * @ru Перехватчик ответа.
 * Принимает объект ответа с любым типом тела (`HttpResponse<any>`). Может вернуть
 * трансформированный объект ответа или `void` (если объект мутирует по ссылке).
 * * @en Response interceptor.
 * Accepts a response object with any body layout (`HttpResponse<any>`). Can return
 * a transformed response container or `void` (if the object is mutated in-place).
 */
export type ResponseInterceptor = (
  response: HttpResponse<any>,
) => HttpResponse<any> | void | Promise<HttpResponse<any> | void>;
