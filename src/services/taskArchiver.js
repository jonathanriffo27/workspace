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

function shouldArchiveNow() {
  const now = new Date();
  const lastArchiveCheck = localStorage.getItem('lastArchiveCheck');
  
  if (!lastArchiveCheck) return true;

  const lastCheck = new Date(parseInt(lastArchiveCheck, 10));
  const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);

  return hoursSinceLastCheck >= 12;
}

async function runArchiveCycle() {
  const count = await archiveCompletedTasks();
  localStorage.setItem('lastArchiveCheck', Date.now().toString());
  return count;
}

function scheduleNextArchive() {
  const ms = getMsUntilNextArchive();
  const nextDate = new Date(Date.now() + ms);
  console.log(`[TaskArchiver] Next archive scheduled: ${nextDate.toLocaleString()}`);

  setTimeout(async () => {
    await runArchiveCycle();
    scheduleNextArchive();
  }, ms);
}

export function initTaskArchiver() {
  console.log('[TaskArchiver] Initializing task archiver service');

  if (shouldArchiveNow()) {
    runArchiveCycle();
  }

  scheduleNextArchive();
}
