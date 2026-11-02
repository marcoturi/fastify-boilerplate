import { check } from 'k6';
import http, { type RefinedResponse, type ResponseType } from 'k6/http';
import { Counter, Rate } from 'k6/metrics';
import type { Options } from 'k6/options';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const createUserFailRate = new Rate('create_user_fail_rate');
const createdUsers = new Counter('created_users');

// ---------------------------------------------------------------------------
// Load profile & thresholds
// ---------------------------------------------------------------------------
export const options: Options = {
  scenarios: {
    seed_users: {
      executor: 'constant-arrival-rate',
      duration: '2s',
      rate: 150,
      timeUnit: '1s',
      preAllocatedVUs: 150,
      maxVUs: 300,
    },
  },
  thresholds: {
    // Built-in HTTP metrics
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    // Custom metrics
    create_user_fail_rate: ['rate<0.05'],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return result;
}

interface CreateUserResponse {
  id: string;
}

function assertCreated(res: RefinedResponse<ResponseType>): boolean {
  return check(res, {
    'status is 201': (r) => r.status === 201,
    'response has id': (r) => {
      const body = r.json() as CreateUserResponse | null;
      return body !== null && typeof body.id === 'string' && body.id.length > 0;
    },
    'latency < 500ms': (r) => r.timings.duration < 500,
  });
}

// ---------------------------------------------------------------------------
// Default function – executed once per VU iteration
// ---------------------------------------------------------------------------
export default function () {
  const payload = JSON.stringify({
    email: `user-${randomString(8)}@test.com`,
    country: `Country-${randomString(5)}`,
    postalCode: '12345',
    street: `${randomString(10)} Street`,
  });

  const baseUrl = 'http://localhost:3000';
  const res = http.post(`${baseUrl}/api/v1/users`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreateUser' },
  });

  const passed = assertCreated(res);
  createUserFailRate.add(!passed);
  if (passed) {
    createdUsers.add(1);
  }
}
