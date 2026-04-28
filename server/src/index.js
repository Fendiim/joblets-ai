import express from "express";
import cors from "cors";
import { analyzeEmail } from "./services/emailAnalyzer.js";
import { getDemoInbox, getDemoInboxCursor, getInboxBatch, hasRemainingEmails } from "./services/mockEmails.js";
import {
  authenticateUser,
  buildInsights,
  connectEmail,
  createUser,
  getApplicationsForUser,
  getRecentActivityForUser,
  getUserById,
  getUserRecordById,
  updateUserInboxState,
  updateApplication,
  upsertApplication
} from "./storage/store.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());

function getUserIdFromRequest(request) {
  return request.header("x-user-id");
}

function requireUser(request, response, next) {
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    return response.status(401).json({ message: "Missing user session." });
  }

  const user = getUserById(userId);
  const userRecord = getUserRecordById(userId);

  if (!user || !userRecord) {
    return response.status(401).json({ message: "User not found." });
  }

  request.user = user;
  request.userRecord = userRecord;
  next();
}

function canRefreshInbox(user) {
  return user.currentRefreshIndex < user.refreshSchedule.length && hasRemainingEmails(user.scanCursor);
}

function buildDashboardPayload(user) {
  const applications = getApplicationsForUser(user.id);

  return {
    user,
    applications,
    recentActivity: getRecentActivityForUser(user.id),
    insights: buildInsights(applications),
    hasMoreEmails: !user.inboxFullyScanned && hasRemainingEmails(user.scanCursor)
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/auth/signup", (request, response) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: "Name, email, and password are required." });
    }

    const user = createUser({ name, email, password });
    response.status(201).json({ user });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/login", (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: "Email and password are required." });
    }

    const user = authenticateUser({ email, password });
    response.json({ user });
  } catch (error) {
    response.status(401).json({ message: error.message });
  }
});

app.post("/api/email/connect", requireUser, (request, response) => {
  try {
    const user = connectEmail(request.user.id);
    response.json({
      message: "Email connected successfully. Demo mode is ready to scan sample inbox data.",
      user
    });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.get("/api/dashboard", requireUser, (request, response) => {
  response.json(buildDashboardPayload(request.user));
});

function processEmailsForUser(userId, emails) {
  const outcomes = [];

  for (const email of emails) {
    const analysis = analyzeEmail(email);
    outcomes.push({
      emailId: email.id,
      subject: email.subject,
      classification: analysis.classification
    });

    if (!analysis.structuredData) {
      continue;
    }

    const result = upsertApplication(userId, {
      company: analysis.structuredData.company,
      role: analysis.structuredData.role,
      dateApplied: analysis.structuredData.date,
      status: analysis.structuredData.status,
      classification: analysis.classification,
      portalLink: analysis.structuredData.portalLink,
      emailLink: analysis.structuredData.emailLink,
      sourceEmailId: email.id,
      emailDate: email.date,
      subject: email.subject,
      snippet: email.body.slice(0, 160)
    });

    outcomes[outcomes.length - 1].action = result.action;
    outcomes[outcomes.length - 1].applicationId = result.record.id;
  }

  return outcomes;
}

app.post("/api/emails/refresh", requireUser, (request, response) => {
  try {
    if (!request.user.emailConnected) {
      return response.status(400).json({ message: "Connect email before refreshing the inbox." });
    }

    if (!canRefreshInbox(request.userRecord)) {
      const user = getUserById(request.user.id);
      const applications = getApplicationsForUser(request.user.id);

      return response.json({
        user,
        applications,
        recentActivity: getRecentActivityForUser(request.user.id),
        insights: buildInsights(applications),
        inboxSummary: {
          processedCount: 0,
          newCount: 0,
          updatedCount: 0,
          hasMoreEmails: false
        },
        newIds: [],
        outcomes: [],
        message: "Inbox fully scanned"
      });
    }

    const shouldDeliverEmails = request.userRecord.refreshSchedule[request.userRecord.currentRefreshIndex];
    const inboxBatch = shouldDeliverEmails
      ? getInboxBatch(request.userRecord.scanCursor)
      : {
          emails: [],
          nextCursor: request.userRecord.scanCursor,
          hasMoreEmails: hasRemainingEmails(request.userRecord.scanCursor)
        };
    const outcomes = processEmailsForUser(request.user.id, inboxBatch.emails);
    const newIds = outcomes
      .filter((entry) => entry.action === "created")
      .map((entry) => entry.applicationId);
    const updatedCount = outcomes.filter((entry) => entry.action === "updated").length;
    const nextRefreshIndex = request.userRecord.currentRefreshIndex + 1;
    const user = updateUserInboxState(request.user.id, {
      scanCursor: inboxBatch.nextCursor,
      currentRefreshIndex: nextRefreshIndex
    });
    const applications = getApplicationsForUser(request.user.id);
    const message =
      shouldDeliverEmails && (newIds.length > 0 || updatedCount > 0)
        ? "New applications found"
        : "No new job-related emails found";

    response.json({
      user,
      applications,
      recentActivity: getRecentActivityForUser(request.user.id),
      insights: buildInsights(applications),
      inboxSummary: {
        processedCount: inboxBatch.emails.length,
        newCount: newIds.length,
        updatedCount,
        hasMoreEmails: canRefreshInbox({
          ...request.userRecord,
          scanCursor: inboxBatch.nextCursor,
          currentRefreshIndex: nextRefreshIndex
        })
      },
      newIds,
      outcomes,
      message
    });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.post("/api/demo/load", requireUser, (request, response) => {
  try {
    const demoEmails = getDemoInbox();
    const demoCursor = getDemoInboxCursor();
    const userWithEmail = request.user.emailConnected ? request.user : connectEmail(request.user.id);
    const outcomes = processEmailsForUser(request.user.id, demoEmails);
    const user = updateUserInboxState(userWithEmail.id, {
      scanCursor: Math.max(request.userRecord.scanCursor, demoCursor)
    });
    const applications = getApplicationsForUser(request.user.id);
    const newIds = outcomes
      .filter((entry) => entry.action === "created")
      .map((entry) => entry.applicationId);
    const updatedCount = outcomes.filter((entry) => entry.action === "updated").length;

    response.json({
      user,
      applications,
      recentActivity: getRecentActivityForUser(request.user.id),
      insights: buildInsights(applications),
      inboxSummary: {
        processedCount: demoEmails.length,
        newCount: newIds.length,
        updatedCount,
        hasMoreEmails: canRefreshInbox({
          ...request.userRecord,
          scanCursor: Math.max(request.userRecord.scanCursor, demoCursor)
        })
      },
      newIds,
      outcomes,
      message: `Demo Mode loaded ${demoEmails.length} curated emails and captured ${newIds.length} applications.`
    });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.put("/api/applications/:id", requireUser, (request, response) => {
  try {
    const updated = updateApplication(request.user.id, request.params.id, request.body);
    const applications = getApplicationsForUser(request.user.id);

    response.json({
      application: updated,
      applications,
      recentActivity: getRecentActivityForUser(request.user.id),
      insights: buildInsights(applications),
      message: "Application updated."
    });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`AI Job Application Tracker API running at http://localhost:${port}`);
});
