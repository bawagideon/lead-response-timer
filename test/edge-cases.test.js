const test = require('node:test');
const assert = require('node:assert/strict');
const { LeadResponseTimer } = require('../src/index.js');

test('ResponseTimer Edge Cases: handles empty event log calculateMetrics', () => {
  const timer = new LeadResponseTimer();
  const metrics = timer.calculateMetrics();
  assert.equal(metrics.totalLeads, 0);
  assert.equal(metrics.medianResponseMinutes, 0);
  assert.equal(metrics.slaComplianceRate, 0);
});

test('ResponseTimer Edge Cases: touch occurring in sub-second is clamped to 0 mins', () => {
  const timer = new LeadResponseTimer();
  const now = new Date().toISOString();
  const res = timer.recordLeadTouch({ leadId: 'fast', receivedAt: now, firstTouchAt: now });
  assert.equal(res.latencyMinutes, 0);
  assert.equal(res.tier, 'ELITE');
});
