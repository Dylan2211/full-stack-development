// In-memory AI call tracker - no database required
// Tracks real AI calls: count, model, success/error, timestamps

class AITracker {
  constructor() {
    this.calls = []; // Store recent calls
    this.maxCalls = 500; // Keep last 500 calls in memory
  }

  // Log an AI call
  track(data) {
    const entry = {
      id: Date.now() + Math.random(), // unique ID
      provider: data.provider || 'unknown',
      model: data.model || 'unknown',
      prompt: data.prompt ? data.prompt.substring(0, 100) : null, // First 100 chars
      response: data.response ? data.response.substring(0, 100) : null,
      // If no tokens provided, treat each call as 1 token so weekly usage reflects call count
      tokens: data.tokens != null ? data.tokens : 1,
      latencyMs: data.latencyMs || 0,
      success: data.success || false,
      errorMessage: data.errorMessage || null,
      timestamp: new Date()
    };

    this.calls.push(entry);

    // Keep only recent calls
    if (this.calls.length > this.maxCalls) {
      this.calls = this.calls.slice(-this.maxCalls);
    }

    console.log(`[AI Tracker] ${entry.provider}/${entry.model} - ${entry.success ? 'SUCCESS' : 'ERROR'} - ${entry.latencyMs}ms`);
  }

  // Get all calls
  getAllCalls() {
    return [...this.calls];
  }

  // Get calls within a time range
  getCallsSince(minutes) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.calls.filter(c => c.timestamp >= cutoff);
  }

  // Get total call count
  getTotalCalls() {
    return this.calls.length;
  }

  // Get success rate
  getSuccessRate() {
    if (this.calls.length === 0) return 0;
    const successful = this.calls.filter(c => c.success).length;
    return Number(((successful / this.calls.length) * 100).toFixed(1));
  }

  // Get error rate
  getErrorRate() {
    if (this.calls.length === 0) return 0;
    const errors = this.calls.filter(c => !c.success).length;
    return Number(((errors / this.calls.length) * 100).toFixed(1));
  }

  // Get average latency
  getAvgLatency() {
    if (this.calls.length === 0) return 0;
    const total = this.calls.reduce((sum, c) => sum + (c.latencyMs || 0), 0);
    return Math.round(total / this.calls.length);
  }

  // Get model breakdown
  getModelStats() {
    const stats = {};
    this.calls.forEach(c => {
      const key = `${c.provider}/${c.model}`;
      if (!stats[key]) {
        stats[key] = { count: 0, totalLatency: 0, errors: 0 };
      }
      stats[key].count++;
      stats[key].totalLatency += c.latencyMs || 0;
      if (!c.success) stats[key].errors++;
    });

    return Object.entries(stats).map(([name, data]) => ({
      model: name,
      calls: data.count,
      avgLatencyMs: Math.round(data.totalLatency / data.count),
      errorRate: Number(((data.errors / data.count) * 100).toFixed(1))
    }));
  }

  // Aggregate by provider only (for agent leaderboard)
  getProviderStats() {
    const stats = {};
    this.calls.forEach(c => {
      const key = c.provider || 'unknown';
      if (!stats[key]) {
        stats[key] = { count: 0, totalLatency: 0, errors: 0 };
      }
      stats[key].count += 1;
      stats[key].totalLatency += c.latencyMs || 0;
      if (!c.success) stats[key].errors += 1;
    });

    return Object.entries(stats).map(([provider, data]) => ({
      provider,
      calls: data.count,
      avgLatencyMs: data.count ? Math.round(data.totalLatency / data.count) : 0,
      errorRate: data.count ? Number(((data.errors / data.count) * 100).toFixed(1)) : 0
    })).sort((a,b) => b.calls - a.calls);
  }

  // Get recent events
  getRecentEvents(limit = 50) {
    return this.calls
      .slice(-limit)
      .reverse()
      .map(c => ({
        id: c.id,
        time: c.timestamp.toLocaleString(),
        message: c.success 
          ? `${c.provider}/${c.model} completed in ${c.latencyMs}ms`
          : `${c.provider}/${c.model} failed: ${c.errorMessage || 'unknown error'}`,
        type: c.success ? 'success' : 'error',
        provider: c.provider,
        model: c.model
      }));
  }

  // Get tokens per day (last 7 days)
  getTokensPerDay() {
    const days = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = 0;
    }

    // Aggregate tokens
    this.calls.forEach(c => {
      const day = c.timestamp.toISOString().split('T')[0];
      if (days[day] !== undefined) {
        days[day] += c.tokens || 0;
      }
    });

    return Object.entries(days).map(([day, tokens]) => ({ day, tokens }));
  }

  // Get call counts per day (last 7 days) — treating each call as one "token"
  getCallCountsPerDay() {
    const days = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = 0;
    }

    this.calls.forEach(c => {
      const day = c.timestamp.toISOString().split('T')[0];
      if (days[day] !== undefined) {
        days[day] += 1;
      }
    });

    return Object.entries(days).map(([day, tokens]) => ({ day, tokens }));
  }

  // Get live activity (calls in recent time buckets)
  getLiveActivity() {
    const now = Date.now();
    const buckets = [
      { label: '60s', seconds: 60 },
      { label: '45s', seconds: 45 },
      { label: '30s', seconds: 30 },
      { label: '15s', seconds: 15 },
      { label: 'Now', seconds: 5 }
    ];

    return buckets.map(bucket => {
      const cutoff = new Date(now - bucket.seconds * 1000);
      const count = this.calls.filter(c => c.timestamp >= cutoff).length;
      return { label: bucket.label, value: count };
    });
  }
}

// Singleton instance
const tracker = new AITracker();

module.exports = tracker;
