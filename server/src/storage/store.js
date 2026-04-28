import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.resolve(moduleDirectory, "..", "..", "data", "store.json");
const REFRESH_SCHEDULE_LENGTH = 10;
const REFRESH_SUCCESS_COUNT = 7;

const defaultData = {
  users: [],
  applications: [],
  activities: []
};

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function createRefreshSchedule() {
  return shuffleArray([
    ...Array.from({ length: REFRESH_SUCCESS_COUNT }, () => true),
    ...Array.from({ length: REFRESH_SCHEDULE_LENGTH - REFRESH_SUCCESS_COUNT }, () => false)
  ]);
}

function normalizeUserRecord(user) {
  let changed = false;
  const nextUser = { ...user };

  if (typeof nextUser.emailConnected !== "boolean") {
    nextUser.emailConnected = Boolean(nextUser.gmailConnected);
    changed = true;
  }

  if (!Array.isArray(nextUser.refreshSchedule) || nextUser.refreshSchedule.length !== REFRESH_SCHEDULE_LENGTH) {
    nextUser.refreshSchedule = createRefreshSchedule();
    changed = true;
  }

  if (typeof nextUser.currentRefreshIndex !== "number" || Number.isNaN(nextUser.currentRefreshIndex)) {
    nextUser.currentRefreshIndex = 0;
    changed = true;
  }

  if (typeof nextUser.scanCursor !== "number" || Number.isNaN(nextUser.scanCursor)) {
    nextUser.scanCursor = 0;
    changed = true;
  }

  return { user: nextUser, changed };
}

function ensureDataFile() {
  const directory = path.dirname(dataFilePath);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
  }
}

function readStore() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFilePath, "utf8");
  const parsed = {
    ...defaultData,
    ...JSON.parse(raw)
  };
  let changed = false;

  parsed.users = parsed.users.map((entry) => {
    const normalized = normalizeUserRecord(entry);
    changed = changed || normalized.changed;
    return normalized.user;
  });

  if (changed) {
    writeStore(parsed);
  }

  return parsed;
}

function writeStore(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

function normalizeKey(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildFallbackEmailLink(record) {
  const sourceId = record.sourceEmailIds?.[0] || record.id;
  return `https://mail.google.com/mail/u/0/#inbox/${sourceId}`;
}

function sanitizeApplication(record) {
  return {
    id: record.id,
    userId: record.userId,
    company: record.company,
    role: record.role,
    dateApplied: record.dateApplied,
    status: record.status,
    classification: record.classification,
    portalLink: record.portalLink || null,
    emailLink: record.emailLink || buildFallbackEmailLink(record),
    sourceEmailIds: record.sourceEmailIds,
    lastEmailDate: record.lastEmailDate,
    subject: record.subject,
    snippet: record.snippet,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function sanitizeActivity(record) {
  return {
    id: record.id,
    userId: record.userId,
    type: record.type,
    company: record.company,
    role: record.role,
    previousStatus: record.previousStatus || null,
    nextStatus: record.nextStatus || null,
    message: record.message,
    createdAt: record.createdAt
  };
}

function sortApplications(applications) {
  return [...applications].sort((left, right) => {
    return new Date(right.lastEmailDate || right.dateApplied) - new Date(left.lastEmailDate || left.dateApplied);
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailConnected: user.emailConnected,
    scanCursor: user.scanCursor,
    currentRefreshIndex: user.currentRefreshIndex,
    refreshesRemaining: Math.max(0, user.refreshSchedule.length - user.currentRefreshIndex),
    inboxFullyScanned: user.currentRefreshIndex >= user.refreshSchedule.length,
    createdAt: user.createdAt
  };
}

function addActivity(data, activity) {
  const record = {
    id: randomUUID(),
    userId: activity.userId,
    type: activity.type,
    company: activity.company,
    role: activity.role,
    previousStatus: activity.previousStatus || null,
    nextStatus: activity.nextStatus || null,
    message: activity.message,
    createdAt: new Date().toISOString()
  };

  data.activities.unshift(record);
  data.activities = data.activities.slice(0, 100);
}

export function createUser({ name, email, password }) {
  const data = readStore();
  const normalizedEmail = email.trim().toLowerCase();

  if (data.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with that email already exists.");
  }

  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    emailConnected: false,
    scanCursor: 0,
    refreshSchedule: createRefreshSchedule(),
    currentRefreshIndex: 0,
    createdAt: new Date().toISOString()
  };

  data.users.push(user);
  writeStore(data);

  return sanitizeUser(user);
}

export function authenticateUser({ email, password }) {
  const data = readStore();
  const normalizedEmail = email.trim().toLowerCase();
  const user = data.users.find((entry) => entry.email === normalizedEmail && entry.password === password);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  return sanitizeUser(user);
}

export function getUserById(userId) {
  const data = readStore();
  const user = data.users.find((entry) => entry.id === userId);
  return user ? sanitizeUser(user) : null;
}

export function getUserRecordById(userId) {
  const data = readStore();
  return data.users.find((entry) => entry.id === userId) || null;
}

export function connectEmail(userId) {
  const data = readStore();
  const user = data.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.emailConnected = true;
  writeStore(data);

  return sanitizeUser(user);
}

export function advanceScanCursor(userId, nextCursor) {
  const data = readStore();
  const user = data.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.scanCursor = nextCursor;
  writeStore(data);

  return sanitizeUser(user);
}

export function updateUserInboxState(userId, updates = {}) {
  const data = readStore();
  const user = data.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (updates.scanCursor !== undefined) {
    user.scanCursor = updates.scanCursor;
  }

  if (updates.currentRefreshIndex !== undefined) {
    user.currentRefreshIndex = updates.currentRefreshIndex;
  }

  writeStore(data);

  return sanitizeUser(user);
}

export function getApplicationsForUser(userId) {
  const data = readStore();
  return sortApplications(data.applications.filter((entry) => entry.userId === userId)).map(sanitizeApplication);
}

export function getRecentActivityForUser(userId, limit = 8) {
  const data = readStore();
  return data.activities
    .filter((entry) => entry.userId === userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit)
    .map(sanitizeActivity);
}

export function upsertApplication(userId, applicationPayload) {
  const data = readStore();
  const sourceEmailId = applicationPayload.sourceEmailId;
  const byEmail = data.applications.find(
    (entry) => entry.userId === userId && entry.sourceEmailIds.includes(sourceEmailId)
  );

  if (byEmail) {
    let changed = false;

    if (applicationPayload.portalLink && !byEmail.portalLink) {
      byEmail.portalLink = applicationPayload.portalLink;
      changed = true;
    }

    if (applicationPayload.emailLink && byEmail.emailLink !== applicationPayload.emailLink) {
      byEmail.emailLink = applicationPayload.emailLink;
      changed = true;
    }

    if (changed) {
      byEmail.updatedAt = new Date().toISOString();
      writeStore(data);
    }

    return { action: "skipped", record: sanitizeApplication(byEmail) };
  }

  const fingerprint = `${normalizeKey(applicationPayload.company)}:${normalizeKey(applicationPayload.role)}`;
  const existing = data.applications.find(
    (entry) => entry.userId === userId && entry.fingerprint === fingerprint
  );

  if (existing) {
    const previousStatus = existing.status;
    existing.status = applicationPayload.status;
    existing.classification = applicationPayload.classification;
    existing.lastEmailDate = applicationPayload.emailDate;
    existing.subject = applicationPayload.subject;
    existing.snippet = applicationPayload.snippet;
    existing.emailLink = applicationPayload.emailLink;
    existing.portalLink = applicationPayload.portalLink || existing.portalLink || null;
    existing.updatedAt = new Date().toISOString();
    existing.sourceEmailIds.push(sourceEmailId);

    if (new Date(applicationPayload.dateApplied) < new Date(existing.dateApplied)) {
      existing.dateApplied = applicationPayload.dateApplied;
    }

    if (previousStatus !== applicationPayload.status) {
      addActivity(data, {
        userId,
        type: "status_updated",
        company: existing.company,
        role: existing.role,
        previousStatus,
        nextStatus: applicationPayload.status,
        message: `${existing.company} moved from ${previousStatus} to ${applicationPayload.status}.`
      });
    }

    writeStore(data);
    return { action: "updated", record: sanitizeApplication(existing) };
  }

  const record = {
    id: randomUUID(),
    userId,
    company: applicationPayload.company,
    role: applicationPayload.role,
    dateApplied: applicationPayload.dateApplied,
    status: applicationPayload.status,
    classification: applicationPayload.classification,
    fingerprint,
    portalLink: applicationPayload.portalLink || null,
    emailLink: applicationPayload.emailLink,
    sourceEmailIds: [sourceEmailId],
    lastEmailDate: applicationPayload.emailDate,
    subject: applicationPayload.subject,
    snippet: applicationPayload.snippet,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.applications.push(record);
  addActivity(data, {
    userId,
    type: "job_added",
    company: record.company,
    role: record.role,
    nextStatus: record.status,
    message: `Added ${record.role} at ${record.company} as ${record.status}.`
  });
  writeStore(data);

  return { action: "created", record: sanitizeApplication(record) };
}

export function updateApplication(userId, applicationId, updates) {
  const data = readStore();
  const record = data.applications.find((entry) => entry.id === applicationId && entry.userId === userId);

  if (!record) {
    throw new Error("Application not found.");
  }

  const nextCompany = updates.company?.trim() || record.company;
  const nextRole = updates.role?.trim() || record.role;
  const nextFingerprint = `${normalizeKey(nextCompany)}:${normalizeKey(nextRole)}`;

  const duplicate = data.applications.find(
    (entry) => entry.userId === userId && entry.id !== applicationId && entry.fingerprint === nextFingerprint
  );

  if (duplicate) {
    throw new Error("Another application with the same company and role already exists.");
  }

  record.company = nextCompany;
  record.role = nextRole;
  record.dateApplied = updates.dateApplied || record.dateApplied;
  record.status = updates.status || record.status;
  record.portalLink = updates.portalLink === undefined ? record.portalLink : updates.portalLink || null;
  record.emailLink = updates.emailLink || record.emailLink || buildFallbackEmailLink(record);
  record.fingerprint = nextFingerprint;
  record.updatedAt = new Date().toISOString();

  writeStore(data);

  return sanitizeApplication(record);
}

export function buildInsights(applications) {
  const totalApplications = applications.length;
  const interviews = applications.filter((entry) => entry.status === "Interview Invitation").length;
  const rejections = applications.filter((entry) => entry.status === "Rejection").length;
  const offers = applications.filter((entry) => entry.status === "Offer").length;
  const responded = applications.filter((entry) =>
    ["Interview Invitation", "Rejection", "Offer"].includes(entry.status)
  ).length;

  return {
    totalApplications,
    interviews,
    rejections,
    offers,
    responseRate: totalApplications ? Math.round((responded / totalApplications) * 100) : 0
  };
}
