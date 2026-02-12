import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// `.default` is needed because Ajv and ajv-formats are CJS packages.
// Under `"module": "NodeNext"`, TypeScript resolves the default import as
// the CJS `module.exports` wrapper, requiring `.default` to reach the
// actual constructor / function at the type level.
export const ajv = addFormats.default(new Ajv.default({}), [
  'date-time',
  'time',
  'date',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uri-reference',
  'uuid',
  'uri-template',
  'json-pointer',
  'relative-json-pointer',
  'regex',
]);
