function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildPortalLink(company, role, id) {
  return `https://jobs.${slugify(company)}.com/candidate/applications/${slugify(role)}-${id.replace(/^email-/, "")}`;
}

function buildJobEmail({ id, sender, company, role, type, date, hasPortal = false, subject }) {
  const emailLink = `https://mail.google.com/mail/u/0/#inbox/${id}`;
  const portalLink = hasPortal ? buildPortalLink(company, role, id) : null;
  const typeTemplates = {
    confirmation: {
      subject: subject || `Application received for ${role} at ${company}`,
      body:
        `Thank you for applying to ${role} at ${company}. ` +
        (portalLink
          ? `You can review your application at ${portalLink} while our team reviews your background.`
          : "Our recruiting team will be in touch if there is a fit.")
    },
    interview: {
      subject: subject || `Interview invitation for ${role} at ${company}`,
      body:
        `We would like to invite you to an interview for the ${role} role at ${company}. ` +
        (portalLink
          ? `Please confirm your availability in the candidate portal at ${portalLink}.`
          : "Please reply with your availability for next week.")
    },
    rejection: {
      subject: subject || `Update on your ${role} application at ${company}`,
      body:
        `We regret to inform you that we will not be moving forward with your application for ${role} at ${company}. ` +
        "We appreciate your interest and the time you invested in the process."
    },
    offer: {
      subject: subject || `Offer for ${role} at ${company}`,
      body:
        `We are excited to extend an offer for ${role} at ${company}. ` +
        (portalLink
          ? `Please review the details in your candidate portal at ${portalLink}.`
          : "Please reply with any questions about next steps.")
    }
  };

  const template = typeTemplates[type];

  return {
    id,
    from: sender,
    subject: template.subject,
    date,
    emailLink,
    ...(portalLink ? { portalLink } : {}),
    body: template.body
  };
}

function buildIrrelevantEmail({ id, sender, subject, body, date }) {
  return {
    id,
    from: sender,
    subject,
    date,
    emailLink: `https://mail.google.com/mail/u/0/#inbox/${id}`,
    body
  };
}

export const SAMPLE_EMAILS = [
  buildJobEmail({
    id: "email-google-confirmation",
    sender: "careers@google.com",
    company: "Google",
    role: "Software Engineer",
    type: "confirmation",
    date: "2026-03-02",
    hasPortal: true
  }),
  buildIrrelevantEmail({
    id: "email-weekly-digest",
    sender: "updates@dailyproductivity.com",
    subject: "Your weekly productivity digest",
    body: "Here is your weekly newsletter with productivity tips, templates, and podcasts you may enjoy.",
    date: "2026-03-03"
  }),
  buildJobEmail({
    id: "email-figma-interview",
    sender: "talent@figma.com",
    company: "Figma",
    role: "Product Designer",
    type: "interview",
    date: "2026-03-05"
  }),
  buildJobEmail({
    id: "email-anthropic-rejection",
    sender: "jobs@anthropic.com",
    company: "Anthropic",
    role: "AI Researcher",
    type: "rejection",
    date: "2026-03-06"
  }),
  buildJobEmail({
    id: "email-google-interview",
    sender: "careers@google.com",
    company: "Google",
    role: "Software Engineer",
    type: "interview",
    date: "2026-03-10",
    hasPortal: true,
    subject: "Next steps for Software Engineer at Google"
  }),
  buildJobEmail({
    id: "email-stripe-confirmation",
    sender: "recruiting@stripe.com",
    company: "Stripe",
    role: "Backend Engineer",
    type: "confirmation",
    date: "2026-03-11",
    hasPortal: true,
    subject: "Thanks for applying to Backend Engineer at Stripe"
  }),
  buildJobEmail({
    id: "email-openai-offer",
    sender: "talent@openai.com",
    company: "OpenAI",
    role: "Applied AI Engineer",
    type: "offer",
    date: "2026-03-12",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-figma-rejection",
    sender: "talent@figma.com",
    company: "Figma",
    role: "Product Designer",
    type: "rejection",
    date: "2026-03-15"
  }),
  buildJobEmail({
    id: "email-notion-confirmation",
    sender: "careers@notion.so",
    company: "Notion",
    role: "Product Marketing Manager",
    type: "confirmation",
    date: "2026-03-16",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-vercel-confirmation",
    sender: "talent@vercel.com",
    company: "Vercel",
    role: "Full Stack Engineer",
    type: "confirmation",
    date: "2026-03-17"
  }),
  buildJobEmail({
    id: "email-ramp-confirmation",
    sender: "jobs@ramp.com",
    company: "Ramp",
    role: "Data Analyst",
    type: "confirmation",
    date: "2026-03-18",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-datadog-confirmation",
    sender: "recruiting@datadoghq.com",
    company: "Datadog",
    role: "Senior Frontend Engineer",
    type: "confirmation",
    date: "2026-03-19"
  }),
  buildJobEmail({
    id: "email-notion-interview",
    sender: "careers@notion.so",
    company: "Notion",
    role: "Product Marketing Manager",
    type: "interview",
    date: "2026-03-20",
    hasPortal: true
  }),
  buildIrrelevantEmail({
    id: "email-conference-promo",
    sender: "events@saasgrowthsummit.com",
    subject: "Save your seat for the SaaS Growth Summit",
    body: "Join hundreds of operators next month for tactical sessions on growth, product, and hiring.",
    date: "2026-03-21"
  }),
  buildJobEmail({
    id: "email-airtable-confirmation",
    sender: "talent@airtable.com",
    company: "Airtable",
    role: "Program Manager",
    type: "confirmation",
    date: "2026-03-22",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-microsoft-confirmation",
    sender: "recruiting@microsoft.com",
    company: "Microsoft",
    role: "Cloud Solutions Architect",
    type: "confirmation",
    date: "2026-03-23"
  }),
  buildJobEmail({
    id: "email-coinbase-confirmation",
    sender: "talent@coinbase.com",
    company: "Coinbase",
    role: "Security Engineer",
    type: "confirmation",
    date: "2026-03-24",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-dropbox-confirmation",
    sender: "jobs@dropbox.com",
    company: "Dropbox",
    role: "Staff Designer",
    type: "confirmation",
    date: "2026-03-25"
  }),
  buildJobEmail({
    id: "email-ramp-rejection",
    sender: "jobs@ramp.com",
    company: "Ramp",
    role: "Data Analyst",
    type: "rejection",
    date: "2026-03-26"
  }),
  buildJobEmail({
    id: "email-netflix-confirmation",
    sender: "talent@netflix.com",
    company: "Netflix",
    role: "Machine Learning Engineer",
    type: "confirmation",
    date: "2026-03-27",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-canva-confirmation",
    sender: "recruiting@canva.com",
    company: "Canva",
    role: "Brand Designer",
    type: "confirmation",
    date: "2026-03-28"
  }),
  buildJobEmail({
    id: "email-microsoft-interview",
    sender: "recruiting@microsoft.com",
    company: "Microsoft",
    role: "Cloud Solutions Architect",
    type: "interview",
    date: "2026-03-29"
  }),
  buildJobEmail({
    id: "email-plaid-confirmation",
    sender: "careers@plaid.com",
    company: "Plaid",
    role: "Software Engineer",
    type: "confirmation",
    date: "2026-03-30",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-datadog-interview",
    sender: "recruiting@datadoghq.com",
    company: "Datadog",
    role: "Senior Frontend Engineer",
    type: "interview",
    date: "2026-03-31",
    hasPortal: true
  }),
  buildIrrelevantEmail({
    id: "email-design-webinar",
    sender: "hello@designopsweekly.com",
    subject: "Free webinar: design systems that scale",
    body: "Reserve your seat for our upcoming webinar on scalable design operations and handoff workflows.",
    date: "2026-04-01"
  }),
  buildJobEmail({
    id: "email-slack-confirmation",
    sender: "jobs@slack.com",
    company: "Slack",
    role: "Developer Relations Manager",
    type: "confirmation",
    date: "2026-04-02"
  }),
  buildJobEmail({
    id: "email-canva-interview",
    sender: "recruiting@canva.com",
    company: "Canva",
    role: "Brand Designer",
    type: "interview",
    date: "2026-04-03"
  }),
  buildJobEmail({
    id: "email-netflix-rejection",
    sender: "talent@netflix.com",
    company: "Netflix",
    role: "Machine Learning Engineer",
    type: "rejection",
    date: "2026-04-04"
  }),
  buildJobEmail({
    id: "email-snowflake-confirmation",
    sender: "careers@snowflake.com",
    company: "Snowflake",
    role: "Data Engineer",
    type: "confirmation",
    date: "2026-04-05",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-linear-confirmation",
    sender: "jobs@linear.app",
    company: "Linear",
    role: "Product Operations Manager",
    type: "confirmation",
    date: "2026-04-06"
  }),
  buildJobEmail({
    id: "email-coinbase-rejection",
    sender: "talent@coinbase.com",
    company: "Coinbase",
    role: "Security Engineer",
    type: "rejection",
    date: "2026-04-07"
  }),
  buildJobEmail({
    id: "email-snowflake-interview",
    sender: "careers@snowflake.com",
    company: "Snowflake",
    role: "Data Engineer",
    type: "interview",
    date: "2026-04-08",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-atlassian-confirmation",
    sender: "talent@atlassian.com",
    company: "Atlassian",
    role: "Platform Engineer",
    type: "confirmation",
    date: "2026-04-09"
  }),
  buildJobEmail({
    id: "email-brex-confirmation",
    sender: "recruiting@brex.com",
    company: "Brex",
    role: "Operations Analyst",
    type: "confirmation",
    date: "2026-04-10",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-plaid-rejection",
    sender: "careers@plaid.com",
    company: "Plaid",
    role: "Software Engineer",
    type: "rejection",
    date: "2026-04-11"
  }),
  buildJobEmail({
    id: "email-brex-interview",
    sender: "recruiting@brex.com",
    company: "Brex",
    role: "Operations Analyst",
    type: "interview",
    date: "2026-04-12",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-loom-confirmation",
    sender: "jobs@loom.com",
    company: "Loom",
    role: "Customer Success Manager",
    type: "confirmation",
    date: "2026-04-13"
  }),
  buildJobEmail({
    id: "email-asana-confirmation",
    sender: "recruiting@asana.com",
    company: "Asana",
    role: "Growth Marketer",
    type: "confirmation",
    date: "2026-04-14"
  }),
  buildJobEmail({
    id: "email-loom-interview",
    sender: "jobs@loom.com",
    company: "Loom",
    role: "Customer Success Manager",
    type: "interview",
    date: "2026-04-15"
  }),
  buildJobEmail({
    id: "email-asana-rejection",
    sender: "recruiting@asana.com",
    company: "Asana",
    role: "Growth Marketer",
    type: "rejection",
    date: "2026-04-16"
  }),
  buildJobEmail({
    id: "email-duolingo-confirmation",
    sender: "careers@duolingo.com",
    company: "Duolingo",
    role: "Localization Manager",
    type: "confirmation",
    date: "2026-04-17",
    hasPortal: true
  }),
  buildJobEmail({
    id: "email-duolingo-interview",
    sender: "careers@duolingo.com",
    company: "Duolingo",
    role: "Localization Manager",
    type: "interview",
    date: "2026-04-18",
    hasPortal: true
  })
];

const DEMO_EMAIL_IDS = new Set([
  "email-google-confirmation",
  "email-google-interview",
  "email-figma-interview",
  "email-figma-rejection",
  "email-stripe-confirmation",
  "email-openai-offer",
  "email-notion-confirmation",
  "email-notion-interview"
]);

function getRandomBatchSize() {
  return Math.floor(Math.random() * 3) + 1;
}

export function getInboxBatch(scanCursor = 0, batchSize = getRandomBatchSize()) {
  const emails = SAMPLE_EMAILS.slice(scanCursor, scanCursor + batchSize);
  const nextCursor = Math.min(SAMPLE_EMAILS.length, scanCursor + emails.length);

  return {
    emails,
    nextCursor,
    hasMoreEmails: nextCursor < SAMPLE_EMAILS.length
  };
}

export function hasRemainingEmails(scanCursor = 0) {
  return scanCursor < SAMPLE_EMAILS.length;
}

export function getDemoInbox() {
  return SAMPLE_EMAILS.filter((email) => DEMO_EMAIL_IDS.has(email.id));
}

export function getDemoInboxCursor() {
  let cursor = 0;

  SAMPLE_EMAILS.forEach((email, index) => {
    if (DEMO_EMAIL_IDS.has(email.id)) {
      cursor = index + 1;
    }
  });

  return cursor;
}
