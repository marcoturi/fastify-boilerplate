/**
 * Checks if value is empty. Accepts strings, numbers, booleans, objects and arrays.
 */
function isEmpty(value: unknown): boolean {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return false;
  }
  if (value === undefined || value === null) {
    return true;
  }
  if (value instanceof Date) {
    return false;
  }
  if (value instanceof Object && Object.keys(value).length === 0) {
    return true;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return true;
    }
    if (value.every((item) => isEmpty(item))) {
      return true;
    }
  }
  return value === '';
}

/**
 * Checks length range of a provided number/string/array
 */
function lengthIsBetween(value: number | string | unknown[], min: number, max: number): boolean {
  if (isEmpty(value)) {
    throw new Error('Cannot check length of a value. Provided value is empty');
  }
  const valueLength = typeof value === 'number' ? Number(value).toString().length : value.length;
  return valueLength >= min && valueLength <= max;
}

export default {
  isEmpty,
  lengthIsBetween,
};
