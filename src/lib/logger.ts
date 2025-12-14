type LogLevel = 'info' | 'error';

const LOG_WEBHOOK_URL = process.env.LOG_WEBHOOK_URL;

export async function logEvent(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const payload = {
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };

  if (!LOG_WEBHOOK_URL) {
    if (level === 'error') {
      console.error('[event]', payload);
    } else {
      console.log('[event]', payload);
    }
    return;
  }

  try {
    await fetch(LOG_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send log event', error, payload);
  }
}
