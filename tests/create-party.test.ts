import { test, expect } from 'vitest';
import { generatePartyCode } from '../lib/party';

test('generates a 6-character uppercase alphanumeric code', () => {
  const code = generatePartyCode();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
});

test('generates unique codes across multiple iterations', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    seen.add(generatePartyCode());
  }
  expect(seen.size).toBe(500);
});
