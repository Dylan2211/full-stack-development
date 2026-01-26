const express = require("express");
const router = express.Router();
const aiTracker = require("../utils/aiTracker");

router.get("/overview", async (req, res) => {
  try {
    const recentCalls = aiTracker.getCallsSince(1); // Last 1 minute
    const errorRate = aiTracker.getErrorRate();
    const avgLatency = aiTracker.getAvgLatency();
    const successRate = aiTracker.getSuccessRate();

    res.json({
      liveRequests: recentCalls.length,
      avgLatency,
      errorRate,
      successRate
    });
  } catch (err) {
    console.error("/overview error:", err?.message || err);
    res.status(500).json({ error: "overview_failed", details: err?.message || String(err) });
  }
});

router.get("/usage", async (req, res) => {
  try {
    // Weekly usage: count each AI task as 1 token
    const usage = aiTracker.getCallCountsPerDay();
    res.json(usage);
  } catch (err) {
    console.error("/usage error:", err?.message || err);
    res.status(500).json({ error: "usage_failed", details: err?.message || String(err) });
  }
});

router.get("/events", async (req, res) => {
  try {
    const events = aiTracker.getRecentEvents(50);
    res.json(events);
  } catch (err) {
    console.error("/events error:", err?.message || err);
    res.status(500).json({ error: "events_failed", details: err?.message || String(err) });
  }
});

// Agent/provider stats
router.get("/agents", async (req, res) => {
  try {
    const agents = aiTracker.getProviderStats();
    res.json(agents);
  } catch (err) {
    console.error("/agents error:", err?.message || err);
    res.status(500).json({ error: "agents_failed", details: err?.message || String(err) });
  }
});

router.get("/live", async (req, res) => {
  try {
    const liveData = aiTracker.getLiveActivity();
    res.json(liveData);
  } catch (err) {
    console.error("/live error:", err?.message || err);
    res.status(500).json({ error: "live_failed", details: err?.message || String(err) });
  }
});

router.post("/mark-accepted", async (req, res) => {
  try {
    const id = req.body?.id;
    console.log(`[Analytics] Mark accepted: ${id} (in-memory tracking - not persisted)`);
    // Since we're using in-memory tracking, we can't persist acceptance flags
    // But we can acknowledge the request
    res.json({ updated: true, note: 'in-memory tracking - not persisted to database' });
  } catch (err) {
    console.error('/mark-accepted error:', err?.message || err);
    res.status(500).json({ error: 'mark_accepted_failed', details: err?.message || String(err) });
  }
});

router.post("/flag-hallucination", async (req, res) => {
  try {
    const id = req.body?.id;
    console.log(`[Analytics] Flag hallucination: ${id} (in-memory tracking - not persisted)`);
    // Since we're using in-memory tracking, we can't persist hallucination flags
    // But we can acknowledge the request
    res.json({ updated: true, note: 'in-memory tracking - not persisted to database' });
  } catch (err) {
    console.error('/flag-hallucination error:', err?.message || err);
    res.status(500).json({ error: 'flag_hallucination_failed', details: err?.message || String(err) });
  }
});

// Stats endpoint for debugging - shows current tracker state
router.get('/stats', async (req, res) => {
  try {
    res.json({
      totalCalls: aiTracker.getTotalCalls(),
      successRate: aiTracker.getSuccessRate() + '%',
      errorRate: aiTracker.getErrorRate() + '%',
      avgLatency: aiTracker.getAvgLatency() + 'ms',
      recentCalls: aiTracker.getAllCalls().slice(-10).map(c => ({
        provider: c.provider,
        model: c.model,
        success: c.success,
        latencyMs: c.latencyMs,
        time: c.timestamp.toLocaleString()
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'stats_failed', details: err?.message || String(err) });
  }
});

// Development mock data endpoint to help frontend render without DB
// Simulate AI calls into the in-memory tracker (for testing)
router.post('/simulate', async (req, res) => {
  try {
    const countSuccess = Number(req.body?.success) || 3;
    const countError = Number(req.body?.error) || 1;
    const provider = req.body?.provider || 'OpenAI';

    for (let i = 0; i < countSuccess; i++) {
      aiTracker.track({
        provider,
        model: req.body?.model || 'gpt-test',
        prompt: `Simulated prompt #${i+1}`,
        response: `Simulated response #${i+1}`,
        tokens: Math.floor(200 + Math.random()*800),
        latencyMs: Math.floor(100 + Math.random()*400),
        success: true
      });
    }

    for (let j = 0; j < countError; j++) {
      aiTracker.track({
        provider,
        model: req.body?.model || 'gpt-test',
        prompt: `Simulated failing prompt #${j+1}`,
        response: null,
        tokens: 0,
        latencyMs: Math.floor(50 + Math.random()*300),
        success: false,
        errorMessage: 'simulated error'
      });
    }

    res.json({ injected: countSuccess + countError, success: countSuccess, error: countError });
  } catch (err) {
    console.error('/simulate error:', err?.message || err);
    res.status(500).json({ error: 'simulate_failed', details: err?.message || String(err) });
  }
});

module.exports = router;


 
