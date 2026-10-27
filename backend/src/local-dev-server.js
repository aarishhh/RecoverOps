import http from 'http';
import { handler } from './handler.js';
import { setDocumentClient } from './services/dynamoService.js';

const PORT = process.env.PORT || 4000;

// Setup in-memory simulated DynamoDB store for local testing
const inMemoryStore = new Map();

// Populate initial sample data
const seedIncidents = [
  {
    id: "INC-9481",
    title: "Stripe webhook 504 gateway timeout on customer checkout",
    description: "Checkout requests are failing intermittently with 504 Gateway Timeout when interacting with the payment provider webhook dispatcher.",
    affectedService: "Payment Gateway",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    assignee: "Alex Rivera",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    rootCause: "",
    resolutionNotes: "",
    timeline: [
      {
        id: "tl-1",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        author: "CloudWatch Alarm",
        type: "SYSTEM",
        message: "High 5xx error rate detected on payment-gateway-alb (threshold: >2% for 5m).",
      },
    ],
  },
  {
    id: "INC-9475",
    title: "Auth & SSO token exchange spike causing latency degradation",
    description: "OAuth 2.0 PKCE authentication flow experiencing elevated p99 latency (>3200ms) due to Redis session lock contention.",
    affectedService: "Auth & SSO Service",
    severity: "HIGH",
    status: "IDENTIFIED",
    assignee: "Marcus Vance",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    rootCause: "Sub-optimal cache key eviction policy caused deadlocks during peak midday token refreshes.",
    resolutionNotes: "",
    timeline: [
      {
        id: "tl-2",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        author: "Marcus Vance",
        type: "INVESTIGATION",
        message: "Profiled auth cluster. Identified lock contention on session validation.",
      },
    ],
  },
];

seedIncidents.forEach((inc) => inMemoryStore.set(inc.id, inc));

// Mock DynamoDB DocumentClient wrapper for standalone local runner
const mockDocClient = {
  async send(command) {
    const cmdName = command.constructor?.name;

    if (cmdName === 'ScanCommand' || !cmdName) {
      const items = Array.from(inMemoryStore.values());
      const { FilterExpression, ExpressionAttributeValues } = command.input || {};

      let filtered = items;
      if (FilterExpression && ExpressionAttributeValues) {
        if (ExpressionAttributeValues[':status']) {
          filtered = filtered.filter((i) => i.status === ExpressionAttributeValues[':status']);
        }
        if (ExpressionAttributeValues[':severity']) {
          filtered = filtered.filter((i) => i.severity === ExpressionAttributeValues[':severity']);
        }
        if (ExpressionAttributeValues[':service']) {
          filtered = filtered.filter((i) => i.affectedService === ExpressionAttributeValues[':service']);
        }
      }

      return { Items: filtered };
    }

    if (cmdName === 'GetCommand') {
      const id = command.input.Key.id;
      return { Item: inMemoryStore.get(id) || null };
    }

    if (cmdName === 'PutCommand') {
      const item = command.input.Item;
      inMemoryStore.set(item.id, item);
      return {};
    }

    if (cmdName === 'UpdateCommand') {
      const id = command.input.Key.id;
      const existing = inMemoryStore.get(id);
      if (existing) {
        const { ExpressionAttributeValues } = command.input;
        const updated = {
          ...existing,
          timeline: ExpressionAttributeValues[':timeline'] || existing.timeline,
          updatedAt: ExpressionAttributeValues[':updatedAt'] || new Date().toISOString(),
        };
        inMemoryStore.set(id, updated);
        return { Attributes: updated };
      }
      return { Attributes: null };
    }

    if (cmdName === 'DeleteCommand') {
      const id = command.input.Key.id;
      inMemoryStore.delete(id);
      return {};
    }

    return {};
  },
};

// Set local mock client
setDocumentClient(mockDocClient);

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = urlObj.pathname;

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    // Construct synthetic API Gateway Lambda proxy event
    const queryStringParameters = {};
    urlObj.searchParams.forEach((val, key) => {
      queryStringParameters[key] = val;
    });

    const event = {
      httpMethod: req.method,
      path: path,
      rawPath: path,
      headers: req.headers,
      queryStringParameters,
      body: body || null,
    };

    try {
      const lambdaResponse = await handler(event, {});

      res.writeHead(lambdaResponse.statusCode, {
        ...lambdaResponse.headers,
        'Content-Type': 'application/json',
      });
      res.end(lambdaResponse.body);
    } catch (err) {
      console.error('Local server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  RecoverOps Local Lambda Dev Server Running`);
  console.log(`  Listening at: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  Incidents:    http://localhost:${PORT}/incidents`);
  console.log(`======================================================\n`);
});
