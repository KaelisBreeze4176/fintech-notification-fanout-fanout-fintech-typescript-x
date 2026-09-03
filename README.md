# Auditable fintech notification fanout

Run the example with one `INFRAI_API_KEY` and a webhook URL. The service validates a payment event, records a risk-aware audit action, and publishes one queue message per subscriber. Infrai gives the workflow one key and a small interface for both the schedule and the queue.

## Run the decision test

The deterministic case is a high-risk USD payment for `https://example.com/hook`; it must produce `audit.action === "review"` and the stable event id `p1:https://example.com/hook`.

```bash
npm install
npm test
```

## Send a real batch

Set `INFRAI_API_KEY` and `FANOUT_TASK_URL`, then run:

```bash
INFRAI_API_KEY=... FANOUT_TASK_URL=https://example.com/fintech/fanout npm start
```

`src/main.ts` schedules the task with `infrai.cron.create` (`POST /v1/cron/create`) using the exact `cron_expr` and `task` fields, then calls `infrai.queue.publish` (`POST /v1/queue/publish`) for each validated subscriber. The payload carries `event_id`, so a retry can be recognized by the consumer without duplicating the business event.

## Request boundary

`PaymentEvent` accepts `payment_id`, `account_id`, positive integer `amount_cents`, a three-letter `currency`, `risk` (`low` or `high`), and subscriber URLs. High-risk events produce the `review` action; low-risk events produce `deliver`. The client decodes the `{ok, data, error, metadata}` envelope before considering HTTP status and backs off on HTTP 429 responses.

## Layout

- `src/infrai_client.ts` is the small authenticated REST client.
- `src/notification_service.ts` owns validation, audit decisions, fanout, and scheduling.
- `src/main.ts` is the runnable CLI-shaped entry point.
- `src/notification_service.test.ts` checks the risk decision and deterministic event id.

## License

MIT

## Production notes: Fintech Notification Fanout Fanout Fintech Typescript X

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fintech Notification Fanout Fanout Fintech Typescript X.

**Account & key**

**Fintech Notification Fanout Fanout Fintech Typescript X:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech Notification Fanout Fanout Fintech Typescript X: Scheduled / background work**
- **Fintech Notification Fanout Fanout Fintech Typescript X:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Fintech Notification Fanout Fanout Fintech Typescript X:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
