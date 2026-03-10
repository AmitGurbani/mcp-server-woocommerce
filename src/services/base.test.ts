import { describe, it, expect } from 'vitest';
import { handleListRequest, handleRequest, resolveFields } from './base.js';

describe('resolveFields', () => {
  const defaults = ['id', 'name', 'status'];

  it('returns defaults when fields is undefined', () => {
    expect(resolveFields(undefined, defaults)).toEqual(defaults);
  });

  it('parses comma-separated fields string', () => {
    expect(resolveFields('id,name', defaults)).toEqual(['id', 'name']);
  });

  it('trims whitespace from field names', () => {
    expect(resolveFields('id , name , price', defaults)).toEqual(['id', 'name', 'price']);
  });

  it('returns single field', () => {
    expect(resolveFields('id', defaults)).toEqual(['id']);
  });

  it('returns empty defaults when defaults is empty and fields is undefined', () => {
    expect(resolveFields(undefined, [])).toEqual([]);
  });
});

describe('handleRequest', () => {
  it('returns filtered data on success', async () => {
    const promise = Promise.resolve({
      data: { id: 1, name: 'Test', secret: 'hidden' },
    });

    const result = await handleRequest(promise, ['id', 'name']);

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: 1, name: 'Test' });
    expect(parsed.secret).toBeUndefined();
  });

  it('returns all specified fields even if missing from data', async () => {
    const promise = Promise.resolve({
      data: { id: 1 },
    });

    const result = await handleRequest(promise, ['id', 'name']);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: 1 });
    expect(parsed).not.toHaveProperty('name');
  });

  it('handles array data with field filtering', async () => {
    const promise = Promise.resolve({
      data: [
        { id: 1, name: 'A', extra: 'x' },
        { id: 2, name: 'B', extra: 'y' },
      ],
    });

    const result = await handleRequest(promise, ['id', 'name']);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]);
  });

  it('returns error for axios-style error with response data', async () => {
    const error: any = new Error('Request failed');
    error.response = { data: { code: 'not_found', message: 'Product not found' }, status: 404 };
    const promise = Promise.reject(error);

    const result = await handleRequest(promise, ['id']);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('[not_found] Product not found');
  });

  it('returns error for axios-style error with only status', async () => {
    const error: any = new Error('Request failed');
    error.response = { status: 500 };
    const promise = Promise.reject(error);

    const result = await handleRequest(promise, ['id']);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('HTTP 500 error');
  });

  it('returns error for standard Error', async () => {
    const promise = Promise.reject(new Error('Network error'));

    const result = await handleRequest(promise, ['id']);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Network error');
  });

  it('returns generic error for unknown error types', async () => {
    const promise = Promise.reject('string error');

    const result = await handleRequest(promise, ['id']);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Unknown error occurred');
  });

  it('handles null/primitive data without filtering', async () => {
    const promise = Promise.resolve({ data: null });

    const result = await handleRequest(promise, ['id']);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toBeNull();
  });
});

describe('handleListRequest', () => {
  it('returns paginated data with filtered fields', async () => {
    const promise = Promise.resolve({
      data: [
        { id: 1, name: 'A', extra: 'x' },
        { id: 2, name: 'B', extra: 'y' },
      ],
      headers: {
        'x-wp-total': '50',
        'x-wp-totalpages': '3',
      },
    });

    const result = await handleListRequest(promise, 1, 20, ['id', 'name']);

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.data).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]);
    expect(parsed.pagination).toEqual({
      total: 50,
      totalPages: 3,
      currentPage: 1,
      perPage: 20,
    });
  });

  it('defaults to 0 total and 1 totalPages when headers missing', async () => {
    const promise = Promise.resolve({
      data: [],
      headers: {},
    });

    const result = await handleListRequest(promise, 1, 10, ['id']);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.pagination).toEqual({
      total: 0,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
    });
  });

  it('returns error on failure', async () => {
    const error: any = new Error('fail');
    error.response = { data: { message: 'Forbidden' }, status: 403 };
    const promise = Promise.reject(error);

    const result = await handleListRequest(promise, 1, 20, ['id']);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      'Forbidden — Authorization error. The API key lacks permission for this action.'
    );
  });
});
