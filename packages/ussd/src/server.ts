/**
 * CEWERS USSD/SMS Gateway Server
 *
 * Provides webhook endpoints for Africa's Talking:
 *   POST /ussd  — USSD session callbacks
 *   POST /sms   — SMS shortcode message callbacks
 *   POST /voice — Voice hotline callback (basic)
 *
 * Also serves a local mock simulator at /simulator for testing
 * without Africa's Talking connectivity.
 */

import express from 'express';
import { IncidentCategory, Channel, type CreateIncidentDto, type Incident } from '@cewers/shared';
import { handleUssd } from './menus.js';
import { parseSms, smsReportToDto, buildHelpReply } from './sms.js';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = parseInt(process.env.USSD_PORT || '4001', 10);
const API_BASE = process.env.AT_CALLBACK_BASE_URL || 'http://localhost:4000';

// ─── API submitter — forwards to the main CEWERS API ─────────────────────────

async function submitToApi(dto: CreateIncidentDto, phone: string): Promise<{ reference: string }> {
  const res = await fetch(`${API_BASE}/api/channels/incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: dto.category,
      description: dto.description,
      lng: dto.geo.lng,
      lat: dto.geo.lat,
      channel: dto.channel,
      reporterPhone: phone,
      priorityHint: dto.priorityHint,
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const incident: Incident = await res.json();
  return { reference: incident.reference };
}

async function trackFromApi(reference: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/incidents?pageSize=1`);
  const data = await res.json();
  const inc = data.items?.find((i: any) => i.reference === reference);
  if (!inc) return `${reference}: Not found`;
  return `${reference}: ${inc.status.replace(/_/g, ' ')} • ${inc.priority}`;
}

// ─── USSD endpoint (Africa's Talking format) ─────────────────────────────────

app.post('/ussd', async (req, res) => {
  const { sessionId, phoneNumber, text, serviceCode } = req.body;
  console.log(`[USSD] ${phoneNumber}: "${text}"`);
  try {
    const result = await handleUssd({ sessionId, phoneNumber, text, serviceCode }, submitToApi);
    res.send(`${result.action} ${result.text}`);
  } catch (err: any) {
    console.error('[USSD] Error:', err.message);
    res.send('END Error. Please call 112.');
  }
});

// ─── SMS endpoint ─────────────────────────────────────────────────────────────

app.post('/sms', async (req, res) => {
  const { from, to, text, id } = req.body;
  console.log(`[SMS] From ${from}: "${text}"`);

  try {
    const report = parseSms(from, text);

    if (report.isHelp) {
      // Send help reply (would use AT SMS API in production)
      console.log(`[SMS] Reply to ${from}: ${buildHelpReply()}`);
    } else if (report.isTracking && report.trackRef) {
      const status = await trackFromApi(report.trackRef);
      console.log(`[SMS] Reply to ${from}: ${status}`);
    } else {
      // Submit incident
      const dto = smsReportToDto(report);
      const result = await submitToApi(dto, from);
      console.log(`[SMS] Report submitted: ${result.reference}. Reply to ${from}: Received. Ref: ${result.reference}`);
    }
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[SMS] Error:', err.message);
    res.json({ status: 'error', message: err.message });
  }
});

// ─── Voice endpoint (basic — logs call for now) ──────────────────────────────

app.post('/voice', async (req, res) => {
  const { callerNumber, destinationNumber, recordingUrl, isActive } = req.body;
  
  if (recordingUrl) {
    console.log(`[VOICE] Received recording from ${callerNumber}: ${recordingUrl}`);
    try {
      const dto: CreateIncidentDto = {
        category: IncidentCategory.SUSPICIOUS_GATHERING, // Default, triage will classify
        description: `Voice Report\nRecording: ${recordingUrl}`,
        geo: { lng: 8.05, lat: 7.2 }, // Default centroid
        channel: Channel.VOICE,
        anonymous: true,
      };
      const result = await submitToApi(dto, callerNumber);
      console.log(`[VOICE] Report submitted: ${result.reference}`);
    } catch (err: any) {
      console.error('[VOICE] Error submitting:', err.message);
    }
  }

  if (isActive === '1') {
    console.log(`[VOICE] Incoming call from ${callerNumber} to ${destinationNumber}`);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" playBeep="true">CEWERS Emergency Line. Your call is being recorded. Please state your emergency.</Say>
  <Record maxLength="120" playBeep="true"/>
</Response>`);
  } else {
    res.json({ status: 'ok' });
  }
});

// ─── Local simulator (test without Africa's Talking) ─────────────────────────

app.get('/simulator', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>CEWERS USSD Simulator</title>
    <style>
      body { font-family: monospace; background: #1A2330; color: #D4875A; padding: 40px; }
      .phone { width: 300px; background: #0D1419; border: 3px solid #D4875A; border-radius: 20px; padding: 20px; margin: 0 auto; }
      .screen { background: #1a2a1a; color: #00ff00; padding: 15px; min-height: 200px; border-radius: 8px; font-size: 13px; white-space: pre-wrap; }
      input { width: 100%; padding: 10px; margin: 5px 0; background: #233040; border: 1px solid #D4875A; color: #fff; border-radius: 5px; }
      button { width: 100%; padding: 12px; background: #D4875A; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
      .sms { margin-top: 20px; }
    </style></head>
    <body><div class="phone">
      <h3 style="text-align:center">📱 CEWERS USSD</h3>
      <div class="screen" id="screen">Dial *937*100# to start</div>
      <input id="input" placeholder="Enter choice..." value="" />
      <button onclick="sendUssd()">Send</button>
      <button onclick="newSession()" style="background:#334455;margin-top:5px">New Session</button>
      <div class="sms">
        <h4>SMS Test</h4>
        <input id="smsfrom" placeholder="Phone" value="+2348012345678" />
        <input id="smstext" placeholder="CEW KIDNAPPING Abduction near Otukpo" />
        <button onclick="sendSms()" style="background:#2563EB">Send SMS</button>
      </div>
    </div>
    <script>
      let sessionText = '';
      async function sendUssd() {
        const val = document.getElementById('input').value;
        sessionText = sessionText ? sessionText + '*' + val : val;
        const res = await fetch('/ussd', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body: 'sessionId=test'+Date.now()+'&phoneNumber=+2348012345678&text='+encodeURIComponent(sessionText)+'&serviceCode=*937*100#' });
        const text = await res.text();
        document.getElementById('screen').textContent = text;
        document.getElementById('input').value = '';
        if (text.startsWith('END')) sessionText = '';
      }
      function newSession() { sessionText=''; document.getElementById('screen').textContent='New session started'; }
      async function sendSms() {
        const from = document.getElementById('smsfrom').value;
        const text = document.getElementById('smstext').value;
        const res = await fetch('/sms', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body: 'from='+from+'&to=20379&text='+encodeURIComponent(text)+'&id=sms'+Date.now() });
        const data = await res.json();
        document.getElementById('screen').textContent = 'SMS sent: ' + JSON.stringify(data);
      }
    </script>
    </body></html>
  `);
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n📡 CEWERS USSD/SMS Gateway running on http://localhost:${PORT}`);
  console.log(`   USSD endpoint:  POST http://localhost:${PORT}/ussd`);
  console.log(`   SMS endpoint:   POST http://localhost:${PORT}/sms`);
  console.log(`   Voice endpoint: POST http://localhost:${PORT}/voice`);
  console.log(`   Simulator:      http://localhost:${PORT}/simulator\n`);
});
