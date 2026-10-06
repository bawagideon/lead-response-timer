/**
 * @gideon/lead-response-timer
 * Project #03 in the Master 50 Business Problem & Revenue Leak Weapons
 * 
 * Commercial Mission:
 * Empirically measures exact minutes from lead creation to first human touch,
 * bins response latency into 4 SLA tiers, and calculates median turnaround.
 */

const LATENCY_TIERS = {
  ELITE: { maxMins: 5, label: '0-5 min', status: 'ELITE', color: 'green', multiplier: 1.0 },
  ACCEPTABLE: { maxMins: 30, label: '5-30 min', status: 'SLOW', color: 'yellow', multiplier: 0.75 },
  HIGH_RISK: { maxMins: 120, label: '30m-2h', status: 'HIGH_RISK', color: 'orange', multiplier: 0.35 },
  BREACHED: { maxMins: Infinity, label: '2h+', status: 'BREACHED', color: 'red', multiplier: 0.10 }
};

class LeadResponseTimer {
  constructor(options = {}) {
    this.targetMins = options.targetMins || 5;
    this.events = [];
  }

  recordLeadTouch({ leadId, receivedAt, firstTouchAt, repName = 'Unassigned', dealValue = 1000 }) {
    const received = new Date(receivedAt).getTime();
    const touch = firstTouchAt ? new Date(firstTouchAt).getTime() : null;
    const isContacted = Boolean(touch);

    const latencyMinutes = isContacted ? Math.max(0, (touch - received) / 60000) : null;

    let tier = LATENCY_TIERS.BREACHED;
    if (isContacted) {
      if (latencyMinutes <= 5) tier = LATENCY_TIERS.ELITE;
      else if (latencyMinutes <= 30) tier = LATENCY_TIERS.ACCEPTABLE;
      else if (latencyMinutes <= 120) tier = LATENCY_TIERS.HIGH_RISK;
      else tier = LATENCY_TIERS.BREACHED;
    }

    const record = {
      leadId,
      dealValue,
      receivedAt: new Date(received).toISOString(),
      firstTouchAt: touch ? new Date(touch).toISOString() : null,
      isContacted,
      latencyMinutes: latencyMinutes !== null ? Math.round(latencyMinutes * 10) / 10 : null,
      tier: tier.status,
      tierLabel: tier.label,
      color: tier.color,
      repName
    };

    this.events.push(record);
    return record;
  }

  calculateMetrics() {
    const total = this.events.length;
    const contacted = this.events.filter(e => e.isContacted);
    const uncontacted = this.events.filter(e => !e.isContacted);

    const latencies = contacted.map(e => e.latencyMinutes).sort((a, b) => a - b);
    let medianMins = 0;
    if (latencies.length > 0) {
      const mid = Math.floor(latencies.length / 2);
      medianMins = latencies.length % 2 !== 0 
        ? latencies[mid] 
        : (latencies[mid - 1] + latencies[mid]) / 2;
    }

    const tierCounts = {
      elite: this.events.filter(e => e.tier === 'ELITE').length,
      acceptable: this.events.filter(e => e.tier === 'SLOW').length,
      highRisk: this.events.filter(e => e.tier === 'HIGH_RISK').length,
      breached: this.events.filter(e => e.tier === 'BREACHED').length
    };

    const slaComplianceRate = total > 0 ? Math.round((tierCounts.elite / total) * 100) : 0;

    return {
      totalLeads: total,
      contactedCount: contacted.length,
      uncontactedCount: uncontacted.length,
      medianResponseMinutes: Math.round(medianMins * 10) / 10,
      slaComplianceRate,
      tierDistribution: tierCounts
    };
  }
}

module.exports = {
  LATENCY_TIERS,
  LeadResponseTimer
};
