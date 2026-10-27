export const SEVERITIES = {
  CRITICAL: {
    label: 'Critical (P0)',
    value: 'CRITICAL',
    badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-500',
    priority: 0,
  },
  HIGH: {
    label: 'High (P1)',
    value: 'HIGH',
    badgeClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dotClass: 'bg-orange-500',
    priority: 1,
  },
  MEDIUM: {
    label: 'Medium (P2)',
    value: 'MEDIUM',
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    dotClass: 'bg-yellow-500',
    priority: 2,
  },
  LOW: {
    label: 'Low (P3)',
    value: 'LOW',
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotClass: 'bg-blue-400',
    priority: 3,
  },
};

export const STATUSES = {
  INVESTIGATING: {
    label: 'Investigating',
    value: 'INVESTIGATING',
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    dotClass: 'bg-purple-500',
    isOpen: true,
  },
  IDENTIFIED: {
    label: 'Identified',
    value: 'IDENTIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dotClass: 'bg-amber-500',
    isOpen: true,
  },
  MONITORING: {
    label: 'Monitoring',
    value: 'MONITORING',
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    dotClass: 'bg-cyan-500',
    isOpen: true,
  },
  RESOLVED: {
    label: 'Resolved',
    value: 'RESOLVED',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    isOpen: false,
  },
};

export const SERVICES = [
  'Payment Gateway',
  'Auth & SSO Service',
  'Billing API',
  'Order Processing Engine',
  'Search Cluster (Elastic)',
  'Data Pipeline & Kafka',
  'Customer Web Portal',
  'Notification & Webhook Dispatcher',
  'Primary Database Cluster',
  'CDN & Edge Routing',
];

export const TEAM_MEMBERS = [
  { name: 'Alex Rivera', email: 'alex.rivera@recoverops.internal', role: 'Staff SRE' },
  { name: 'Sarah Chen', email: 'sarah.chen@recoverops.internal', role: 'Lead DevOps' },
  { name: 'Marcus Vance', email: 'marcus.v@recoverops.internal', role: 'Backend Lead' },
  { name: 'Priya Sharma', email: 'priya.s@recoverops.internal', role: 'Platform Engineer' },
  { name: 'Elena Rostova', email: 'elena.r@recoverops.internal', role: 'Security Ops' },
  { name: 'Unassigned', email: '', role: '' },
];
