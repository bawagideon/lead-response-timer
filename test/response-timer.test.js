const test = require('node:test');
const assert = require('node:assert/strict');
const { LeadResponseTimer } = require('../src/index.js');

test('ResponseTimer: records touch and categorizes into Elite', () => {
  const timer = new LeadResponseTimer();
  const res = timer.recordLeadTouch({
    leadId: 'l1',
    receivedAt: '2026-10-05T10:00:00Z',
    firstTouchAt: '2026-10-05T10:03:00Z',
    repName: 'Sarah M.'
  });

  assert.equal(res.isContacted, true);
  assert.equal(res.latencyMinutes, 3);
  assert.equal(res.tier, 'ELITE');
});

test('ResponseTimer: flags uncontacted lead as breached', () => {
  const timer = new LeadResponseTimer();
  const res = timer.recordLeadTouch({
    leadId: 'l2',
    receivedAt: '2026-10-05T08:00:00Z',
    firstTouchAt: null
  });

  assert.equal(res.isContacted, false);
  assert.equal(res.tier, 'BREACHED');
  assert.equal(res.latencyMinutes, null);
});

test('ResponseTimer: computes accurate median latency across multiple leads', () => {
  const timer = new LeadResponseTimer();
  // 4m, 12m, 45m, 180m
  timer.recordLeadTouch({ leadId: '1', receivedAt: '2026-10-05T10:00:00Z', firstTouchAt: '2026-10-05T10:04:00Z' });
  timer.recordLeadTouch({ leadId: '2', receivedAt: '2026-10-05T10:00:00Z', firstTouchAt: '2026-10-05T10:12:00Z' });
  timer.recordLeadTouch({ leadId: '3', receivedAt: '2026-10-05T10:00:00Z', firstTouchAt: '2026-10-05T10:45:00Z' });
  timer.recordLeadTouch({ leadId: '4', receivedAt: '2026-10-05T10:00:00Z', firstTouchAt: '2026-10-05T13:00:00Z' });

  const metrics = timer.calculateMetrics();
  assert.equal(metrics.totalLeads, 4);
  assert.equal(metrics.contactedCount, 4);
  // Median of [4, 12, 45, 180] is (12 + 45) / 2 = 28.5
  assert.equal(metrics.medianResponseMinutes, 28.5);
  assert.equal(metrics.tierDistribution.elite, 1);
  assert.equal(metrics.tierDistribution.acceptable, 1);
  assert.equal(metrics.tierDistribution.highRisk, 1);
  assert.equal(metrics.tierDistribution.breached, 1);
});
