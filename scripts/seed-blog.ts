import "./load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(sql, { schema });

async function main() {
  await db
    .insert(schema.blogPosts)
    .values({
      slug: "how-we-built-a-whatsapp-bot-for-retail",
      title: "How we built a WhatsApp bot for a retail business",
      excerpt:
        "A step-by-step look at how we automated order updates, FAQs, and customer support for a retail client using a WhatsApp bot.",
      contentMarkdown: `
## The problem

Our client ran a mid-sized retail store with a small support team. Every day, the same questions came in: "Where is my order?", "What are your store hours?", "Do you deliver to Delhi?" The team spent hours on replies that could be automated.

## What we built

We used the WhatsApp Business API with:

- **Order status lookups**: the customer types an order ID and gets the live status.
- **FAQ automation**: store hours, returns, and delivery zones answered instantly.
- **Human handoff**: unanswered questions reach a live agent with the full conversation.

## The result

Response time for most queries dropped from hours to seconds. The team now handles only complex work.

## Tech stack

Node.js, webhooks, a small backend, and an admin screen for editing FAQ answers without touching code.

If your business gets repetitive WhatsApp queries, this is one of the fastest automations to ship. [Talk to us](/contact) about your use case.
      `.trim(),
      author: "GetwithUs",
      tags: ["automation", "WhatsApp"],
      status: "published",
      publishedAt: new Date("2026-11-15"),
      seoTitle: "WhatsApp bot for retail | GetwithUs",
      seoDescription: "How GetwithUs automated retail support with a WhatsApp bot.",
    })
    .onConflictDoNothing();

  await db
    .insert(schema.blogPosts)
    .values({
      slug: "nextjs-vs-wordpress-for-indian-businesses",
      title: "Next.js vs WordPress: which is right for your Indian business?",
      excerpt:
        "WordPress powers a large part of the web, but is it right for a growing business in 2026? We compare performance, SEO, cost, and flexibility.",
      contentMarkdown: `
## The honest answer

It depends on what you are building. Many growing businesses pick the wrong tool for the wrong reason, usually because someone said WordPress is cheaper.

## Where WordPress wins

- A simple blog or brochure site with no custom features.
- A non-technical team publishing every day.
- A tight initial budget with no developer on call.

## Where Next.js wins

- **Performance**: server-rendered pages and small client bundles.
- **SEO**: predictable metadata and fast indexing.
- **Custom features**: booking, dashboards, payments, and WhatsApp integrations.
- **Security**: a much smaller plugin surface than a WordPress install.

## The cost question

WordPress hosting starts cheaper, but premium plugins, fixes, and performance work add up. A well-built Next.js site costs more upfront and less over three years.

See our [web development service](/services/web-development) for what we build.
      `.trim(),
      author: "GetwithUs",
      tags: ["web", "Next.js"],
      status: "published",
      publishedAt: new Date("2026-11-10"),
    })
    .onConflictDoNothing();

  await db
    .insert(schema.blogPosts)
    .values({
      slug: "how-much-does-app-development-cost-india",
      title: "How much does app development cost in India in 2026?",
      excerpt:
        "An honest breakdown of mobile app development costs in India: what drives the price, what to watch out for, and a realistic budget.",
      contentMarkdown: `
## The range is wide for a reason

Quotes from 50,000 rupees to 50 lakh rupees can both be real. The difference is what you are actually getting.

## What drives the cost

- **Platform**: iOS, Android, or both. Cross-platform covers both for about 1.4x one platform.
- **Backend**: a read-only app costs far less than one with sync, payments, or push notifications.
- **Design**: custom UI adds time; a design system cuts it.
- **Integrations**: maps, payments, WhatsApp, and third-party APIs each add scope.

## Realistic numbers

- **Simple utility app**: 1.5 to 3 lakh rupees.
- **Business app with login and database**: 4 to 10 lakh rupees.
- **Marketplace or platform**: 12 lakh rupees and up.

Watch for quotes that leave out the backend, design, or store submission. Those are the usual reasons a small quote grows mid-project.

We give fixed-price quotes in writing. [Start with a brief](/start) and we will reply within one business day.
      `.trim(),
      author: "GetwithUs",
      tags: ["mobile", "costs"],
      status: "published",
      publishedAt: new Date("2026-11-05"),
    })
    .onConflictDoNothing();

  console.log("3 test blog posts seeded.");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
