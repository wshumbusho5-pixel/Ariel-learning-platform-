import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run a simple test', () => {
    expect(true).toBe(true);
  });

  it('should have access to testing globals', () => {
    expect(expect).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
  });

  it('should have localStorage mocked', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.clear();
  });
});
