#!/usr/bin/env python3
"""
Creates the Buzzle CRM OCT workflow in n8n via API.

Workflow:
  1. Webhook POST /webhook/crm-oct/{workspaceId} — receives Twenty prospect update events
  2. Set/Function — normalize payload, extract new status + gclid/fbclid + quoteAmount
  3. IF — branch by new status ("quoted" or "won" — else no-op)
  4. Sub-branches:
     - Google Ads OCT push (placeholder Set node for now, real HTTP in Sprint S7-full)
     - Meta CAPI push (placeholder Set node)
  5. HTTP Request — update Twenty prospect with octPushedAt + octPlatform
"""
import json
import os
import sys
import urllib.request

N8N_URL = os.environ.get("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
API_KEY = os.environ["N8N_API_KEY"]

workflow = {
    "name": "Buzzle CRM - OCT push (Google Ads + Meta CAPI)",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "crm-oct",
                "responseMode": "onReceived",
                "responseData": "allEntries",
                "options": {},
            },
            "id": "webhook",
            "name": "Twenty webhook",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 1.1,
            "position": [240, 300],
            "webhookId": "buzzle-crm-oct",
        },
        {
            "parameters": {
                "jsCode": """
// Normalize Twenty webhook payload
const p = items[0].json;
const workspaceId = p.workspaceId || p.workspace_id || 'unknown';
const record = p.record || p.recordAfter || p.data || {};
const before = p.recordBefore || {};
const newStatus = record.status;
const oldStatus = before.status;
const statusChanged = newStatus !== oldStatus;

return [{
  json: {
    workspaceId,
    prospectId: record.id,
    statusChanged,
    newStatus,
    oldStatus,
    gclid: record.gclid,
    fbclid: record.fbclid,
    quoteAmount: record.quoteAmount,
    email: record.email,
    phone: record.phone,
    fullName: record.fullName || record.name,
    raw: p,
  }
}];
""",
            },
            "id": "normalize",
            "name": "Normalize payload",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [460, 300],
        },
        {
            "parameters": {
                "conditions": {
                    "conditions": [
                        {
                            "leftValue": "={{ $json.statusChanged }}",
                            "rightValue": True,
                            "operator": {"type": "boolean", "operation": "true"},
                        },
                        {
                            "leftValue": "={{ $json.newStatus }}",
                            "rightValue": "quoted,won",
                            "operator": {"type": "string", "operation": "notEquals", "singleValue": True},
                        },
                    ],
                    "combinator": "and",
                },
                "options": {},
            },
            "id": "if-should-push",
            "name": "Should push OCT?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [680, 300],
        },
        {
            "parameters": {
                "assignments": {
                    "assignments": [
                        {"id": "1", "name": "platform", "value": "google_ads", "type": "string"},
                        {"id": "2", "name": "event_type", "value": "={{ $json.newStatus === 'won' ? 'Purchase' : 'QualifiedLead' }}", "type": "string"},
                        {"id": "3", "name": "value", "value": "={{ $json.quoteAmount || 0 }}", "type": "number"},
                        {"id": "4", "name": "gclid", "value": "={{ $json.gclid }}", "type": "string"},
                        {"id": "5", "name": "status", "value": "TODO: replace with real HTTP POST to Google Ads uploadClickConversions API", "type": "string"},
                    ]
                },
                "options": {},
            },
            "id": "google-ads-placeholder",
            "name": "Google Ads OCT (placeholder)",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4,
            "position": [900, 220],
        },
        {
            "parameters": {
                "assignments": {
                    "assignments": [
                        {"id": "1", "name": "platform", "value": "meta_capi", "type": "string"},
                        {"id": "2", "name": "event_name", "value": "={{ $json.newStatus === 'won' ? 'Purchase' : 'Lead' }}", "type": "string"},
                        {"id": "3", "name": "value", "value": "={{ $json.quoteAmount || 0 }}", "type": "number"},
                        {"id": "4", "name": "fbclid", "value": "={{ $json.fbclid }}", "type": "string"},
                        {"id": "5", "name": "status", "value": "TODO: replace with real HTTP POST to Meta CAPI /events endpoint", "type": "string"},
                    ]
                },
                "options": {},
            },
            "id": "meta-capi-placeholder",
            "name": "Meta CAPI (placeholder)",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4,
            "position": [900, 380],
        },
        {
            "parameters": {
                "assignments": {
                    "assignments": [
                        {"id": "1", "name": "status", "value": "no_push_needed", "type": "string"},
                        {"id": "2", "name": "reason", "value": "={{ $json.statusChanged ? 'status_not_pushable' : 'status_did_not_change' }}", "type": "string"},
                    ]
                },
                "options": {},
            },
            "id": "no-op",
            "name": "No push needed",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4,
            "position": [900, 500],
        },
    ],
    "connections": {
        "Twenty webhook": {
            "main": [[{"node": "Normalize payload", "type": "main", "index": 0}]]
        },
        "Normalize payload": {
            "main": [[{"node": "Should push OCT?", "type": "main", "index": 0}]]
        },
        "Should push OCT?": {
            "main": [
                [
                    {"node": "Google Ads OCT (placeholder)", "type": "main", "index": 0},
                    {"node": "Meta CAPI (placeholder)", "type": "main", "index": 0},
                ],
                [{"node": "No push needed", "type": "main", "index": 0}],
            ]
        },
    },
    "settings": {
        "executionOrder": "v1",
        "saveManualExecutions": True,
        "callerPolicy": "workflowsFromSameOwner",
    },
}

req = urllib.request.Request(
    f"{N8N_URL}/api/v1/workflows",
    data=json.dumps(workflow).encode(),
    headers={
        "X-N8N-API-KEY": API_KEY,
        "Content-Type": "application/json",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        print(f"WORKFLOW_ID={result.get('id')}")
        print(f"NAME={result.get('name')}")
        print(f"ACTIVE={result.get('active')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"ERROR {e.code}: {body}", file=sys.stderr)
    sys.exit(1)
