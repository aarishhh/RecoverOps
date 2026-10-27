export const INITIAL_MOCK_INCIDENTS = [
  {
    id: "INC-9481",
    title: "Stripe webhook 504 gateway timeout on customer checkout",
    description: "Checkout requests are failing intermittently with 504 Gateway Timeout when interacting with the payment provider webhook dispatcher. Approximately 12% of card transactions impacted in us-east-1.",
    affectedService: "Payment Gateway",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    assignee: "Alex Rivera",
    createdAt: "2026-10-27T14:20:00.000Z",
    updatedAt: "2026-10-27T15:45:00.000Z",
    rootCause: "",
    resolutionNotes: "",
    timeline: [
      {
        id: "tl-1",
        timestamp: "2026-10-27T14:20:00.000Z",
        author: "CloudWatch Alarm",
        type: "SYSTEM",
        message: "High 5xx error rate detected on payment-gateway-alb (threshold: >2% for 5m, current: 12.4%). Incident auto-created."
      },
      {
        id: "tl-2",
        timestamp: "2026-10-27T14:25:00.000Z",
        author: "Alex Rivera",
        type: "INVESTIGATION",
        message: "Acknowledged P0 incident. Checking egress NAT gateway connection limits and downstream provider status page."
      },
      {
        id: "tl-3",
        timestamp: "2026-10-27T15:10:00.000Z",
        author: "Alex Rivera",
        type: "UPDATE",
        message: "Downstream payment partner confirms degraded API latency in us-east region. Implementing fallback circuit breaker to retry via secondary provider."
      }
    ]
  },
  {
    id: "INC-9475",
    title: "Auth & SSO token exchange spike causing latency degradation",
    description: "OAuth 2.0 PKCE authentication flow experiencing elevated p99 latency (>3200ms) due to Redis session cache lock contention.",
    affectedService: "Auth & SSO Service",
    severity: "HIGH",
    status: "IDENTIFIED",
    assignee: "Marcus Vance",
    createdAt: "2026-10-27T11:15:00.000Z",
    updatedAt: "2026-10-27T13:30:00.000Z",
    rootCause: "Sub-optimal cache key eviction policy caused deadlocks during peak midday token refreshes.",
    resolutionNotes: "",
    timeline: [
      {
        id: "tl-10",
        timestamp: "2026-10-27T11:15:00.000Z",
        author: "Marcus Vance",
        type: "SYSTEM",
        message: "Incident opened following multiple customer complaints regarding slow logins."
      },
      {
        id: "tl-11",
        timestamp: "2026-10-27T12:00:00.000Z",
        author: "Marcus Vance",
        type: "INVESTIGATION",
        message: "Profiled auth service cluster. Identified lock contention on tenant session key validation."
      },
      {
        id: "tl-12",
        timestamp: "2026-10-27T13:30:00.000Z",
        author: "Marcus Vance",
        type: "UPDATE",
        message: "Status updated to IDENTIFIED. Preparing hotfix to disable blocking locks and utilize optimistic read validation."
      }
    ]
  },
  {
    id: "INC-9462",
    title: "Elasticsearch index shard unassigned following node restart",
    description: "Order search queries returning incomplete results for orders created in the last 24 hours. Primary shard for index `orders-2026-10` was marked unassigned.",
    affectedService: "Search Cluster (Elastic)",
    severity: "MEDIUM",
    status: "MONITORING",
    assignee: "Sarah Chen",
    createdAt: "2026-10-26T18:00:00.000Z",
    updatedAt: "2026-10-27T09:00:00.000Z",
    rootCause: "Underlying EBS volume IOPS throttle during scheduled automated backup snapshot.",
    resolutionNotes: "Rerouted shard allocation manually and scaled cluster storage throughput.",
    timeline: [
      {
        id: "tl-20",
        timestamp: "2026-10-26T18:00:00.000Z",
        author: "Sarah Chen",
        type: "SYSTEM",
        message: "Cluster health transitioned from GREEN to YELLOW."
      },
      {
        id: "tl-21",
        timestamp: "2026-10-26T19:30:00.000Z",
        author: "Sarah Chen",
        type: "UPDATE",
        message: "Triggered POST /_cluster/reroute. Recovery synchronization started at 45MB/s."
      },
      {
        id: "tl-22",
        timestamp: "2026-10-27T09:00:00.000Z",
        author: "Sarah Chen",
        type: "UPDATE",
        message: "Cluster back to GREEN. Monitoring search query latency through morning traffic peak."
      }
    ]
  },
  {
    id: "INC-9450",
    title: "Billing subscription invoice calculation race condition",
    description: "Duplicate pro-rata invoices generated for yearly upgraded enterprise accounts between 02:00 and 03:30 UTC.",
    affectedService: "Billing API",
    severity: "HIGH",
    status: "RESOLVED",
    assignee: "Elena Rostova",
    createdAt: "2026-10-25T03:30:00.000Z",
    updatedAt: "2026-10-25T08:15:00.000Z",
    rootCause: "Cron scheduler triggered concurrently across 2 container tasks without distributed Redis lease lock.",
    resolutionNotes: "Implemented Redlock distributed lock with 60-second TTL on billing batch executor. Voided 14 duplicate draft invoices in Stripe and notified affected finance teams.",
    timeline: [
      {
        id: "tl-30",
        timestamp: "2026-10-25T03:30:00.000Z",
        author: "Billing Alert System",
        type: "SYSTEM",
        message: "Discrepancy detected between ledger events and generated invoices."
      },
      {
        id: "tl-31",
        timestamp: "2026-10-25T05:00:00.000Z",
        author: "Elena Rostova",
        type: "INVESTIGATION",
        message: "Isolated concurrent job executions in task log groups."
      },
      {
        id: "tl-32",
        timestamp: "2026-10-25T08:15:00.000Z",
        author: "Elena Rostova",
        type: "RESOLVED",
        message: "Incident resolved. Code hotfix deployed to production and duplicate records cleaned."
      }
    ]
  },
  {
    id: "INC-9441",
    title: "Kafka consumer lag exceeding 50,000 messages on telemetry topic",
    description: "Analytics ingestion consumer group lag caused dashboard metric refresh delays of up to 45 minutes.",
    affectedService: "Data Pipeline & Kafka",
    severity: "LOW",
    status: "RESOLVED",
    assignee: "Priya Sharma",
    createdAt: "2026-10-24T10:00:00.000Z",
    updatedAt: "2026-10-24T12:30:00.000Z",
    rootCause: "Downstream ClickHouse ingestion batch size was set too low (500 records instead of 10,000).",
    resolutionNotes: "Tuned batch configuration in Helm values and scaled consumer worker replica count from 3 to 6.",
    timeline: [
      {
        id: "tl-40",
        timestamp: "2026-10-24T10:00:00.000Z",
        author: "Priya Sharma",
        type: "SYSTEM",
        message: "Consumer lag alert fired."
      },
      {
        id: "tl-41",
        timestamp: "2026-10-24T12:30:00.000Z",
        author: "Priya Sharma",
        type: "RESOLVED",
        message: "Lag drained to zero. All metric charts reflecting real-time data."
      }
    ]
  }
];
