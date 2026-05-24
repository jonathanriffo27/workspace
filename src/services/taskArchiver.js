import { archiveCompletedTasks } from './dataService.js';

const ARCHIVE_HOUR = 3;

function getMsUntilNextArchive() {
  const now = new Date();
  const target = new Date();
  target.setHours(ARCHIVE_HOUR, 0, 0, 0);

  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

function getStorageKey(userId) {
  return `lastArchiveCheck_${userId}`;
}

function shouldArchiveNow(userId) {
  if (!userId) return false;
  
  const now = new Date();
  const storageKey = getStorageKey(userId);
  const lastArchiveTimestamp = localStorage.getItem(storageKey);
  
  if (!lastArchiveTimestamp) return true;

  const lastArchiveDate = new Date(parseInt(lastArchiveTimestamp, 10));
  
  // Calculate the start of the current "archive cycle" (the most recent 3 AM)
  const mostRecentArchiveTime = new Date(now.getTime());
  mostRecentArchiveTime.setHours(ARCHIVE_HOUR, 0, 0, 0);

  // If it's currently before 3 AM, the most recent archive cycle started at 3 AM YESTERDAY
  if (now < mostRecentArchiveTime) {
    mostRecentArchiveTime.setDate(mostRecentArchiveTime.getDate() - 1);
  }

  // We should archive if the last archive happened before that most recent 3 AM
  const needsArchive = lastArchiveDate < mostRecentArchiveTime;
  
  if (needsArchive) {
    console.log(`[TaskArchiver] Missed archive window. Last: ${lastArchiveDate.toLocaleString()}, Target was: ${mostRecentArchiveTime.toLocaleString()}`);
  }

  return needsArchive;
}

async function runArchiveCycle(userId) {
  if (!userId) return 0;
  const count = await archiveCompletedTasks();
  localStorage.setItem(getStorageKey(userId), Date.now().toString());
  return count;
}

let archiveTimeout = null;

function scheduleNextArchive(userId) {
  if (!userId) return;
  
  if (archiveTimeout) clearTimeout(archiveTimeout);

  const ms = getMsUntilNextArchive();
  const nextDate = new Date(Date.now() + ms);
  console.log(`[TaskArchiver] Next archive scheduled: ${nextDate.toLocaleString()} (Zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone})`);

  archiveTimeout = setTimeout(async () => {
    await runArchiveCycle(userId);
    scheduleNextArchive(userId);
  }, ms);
}

export function initTaskArchiver(userId) {
  if (!userId) {
    console.warn('[TaskArchiver] Cannot initialize without userId');
    return;
  }

  console.log(`[TaskArchiver] Initializing for user ${userId}. System Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  if (shouldArchiveNow(userId)) {
    runArchiveCycle(userId);
  }

  scheduleNextArchive(userId);
}
