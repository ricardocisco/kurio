import { useEffect, useState } from 'react';

import { subscribeToAnnouncements } from './announce';

export function LiveAnnouncer() {
  const [message, setMessage] = useState('');

  useEffect(
    () =>
      subscribeToAnnouncements((next) => {
        setMessage('');
        requestAnimationFrame(() => setMessage(next));
      }),
    [],
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="live-announcer"
    >
      {message}
    </div>
  );
}
