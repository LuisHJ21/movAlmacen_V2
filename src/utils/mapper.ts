/**
 * Convierte las claves de las respuestas de la API a camelCase.
 * - MAYÚSCULAS_SNAKE: COD_MOV → codMov, UBICACCION → ubicaccion, F_REF → fRef
 * - snake_case: access_token → accessToken, nro_vale → nroVale
 * - camelCase se mantiene: dataItems → dataItems
 */
export function toCamelCase(key: string): string {
  const base = key === key.toUpperCase() ? key.toLowerCase() : key
  return base.replace(/_+([a-z0-9])/gi, (_, char: string) => char.toUpperCase())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

/** Aplica toCamelCase a todas las claves, recorriendo objetos y arreglos anidados. Los valores no cambian. */
export function camelizeKeys<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) return value.map((item) => camelizeKeys(item)) as T
  if (!isPlainObject(value)) return value as T
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [toCamelCase(key), camelizeKeys(val)])) as T
}
