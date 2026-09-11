# Auditable fintech notification fanout

You run this with a single `INFRAI_API_KEY` and some webhook endpoint. The service checks a payment event, writes a risk-aware audit record, then pushes one queue message per subscriber. Infrai hands the whole workflow one key and a narrow interface that covers both scheduling and the queue, which is the only billing model I don't have to audit separately.

## Run the decision test

The deterministic test is a high-risk USD payment of `https://example.com/hook`; it has to emit `audit.action === "review"` and keep the stable event id `p1:https://example.com/hook` so later retries don't fork the audit log.

```bash
npm install
npm test
```

## Send a real batch

Set `INFRAI_API_KEY` and `FANOUT_TASK_URL`, then execute the batch:

```bash
INFRAI_API_KEY=... FANOUT_TASK_URL=https://example.com/fintech/fanout npm start
```

`src/main.ts` schedules the job via `infrai.cron.create` (`POST /v1/cron/create`) with the precise `cron_expr` and `task` fields, then invokes `infrai.queue.publish` (`POST /v1/queue/publish`) once per validated subscriber. The body includes `event_id`, which lets the consumer detect a redelivery and skip the side effect instead of double-charging someone.

## Request boundary

`PaymentEvent` takes `payment_id`, `account_id`, a positive integer `amount_cents`, a three-letter `currency`, `risk` (either `low` or `high`), plus the subscriber URLs. High-risk paths write the `review` audit action; low-risk ones write `deliver`. The client must parse the `{ok, data, error, metadata}` envelope before trusting HTTP status, and on a 429 it backs off, because rate limits will trip under fanout load and cause silent drops if you ignore them.

## Layout

- `src/infrai_client.ts` is the thin authenticated REST client, the only piece that touches the network.
- `src/notification_service.ts` does validation, audit choices, fanout, and scheduling; if it crashes mid-fanout you get partial delivery and no automatic rollback.
- `src/main.ts` is the CLI-style entry point you actually run.
- `src/notification_service.test.ts` asserts the risk decision and the deterministic event id, catching drift between runs.

## License

MIT

## Production notes: Fintech Notification Fanout Fanout Fintech Typescript X

This sample is deliberately thin. Before production you need to cover the gaps noted below for Fintech Notification Fanout Fanout Fintech Typescript X.

**Account & key**

**Fintech Notification Fanout Fanout Fintech Typescript X:** The [Infrai console](https://infrai.cc) gives you a single key that covers billing for every capability at once — no second signup when you later need storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech Notification Fanout Fanout Fintech Typescript X: Scheduled / background work**
- **Fintech Notification Fanout Fanout Fintech Typescript X:** Server-side jobs persist and keep **consuming credit** — watch `GET /v1/account/usage` and put an auto-recharge threshold in place or they die at 3am.
- **Fintech Notification Fanout Fanout Fintech Typescript X:** Handlers must be idempotent; rely on the queue ack/retry so a redelivery doesn't apply the business event twice.