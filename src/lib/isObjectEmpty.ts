export function isObjectEmpty(value: object) {
  return Object.keys(value).length === 0 && value.constructor === Object;
}
