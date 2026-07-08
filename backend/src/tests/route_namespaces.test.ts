import request from 'supertest';
import app from '../index';

describe('0083 — Express API Route Namespacing (/api/v1/supplier & /api/v1/marketplace)', () => {
  it('should respond to /api/v1/supplier/health or supplier inventory route namespace', async () => {
    const res = await request(app).get('/api/v1/supplier/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.namespace).toBe('supplier');
  });

  it('should respond to /api/v1/marketplace/health or public marketplace route namespace', async () => {
    const res = await request(app).get('/api/v1/marketplace/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.namespace).toBe('marketplace');
  });
});
