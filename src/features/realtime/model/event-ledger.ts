import type { RealtimeEvent } from '@/shared/contracts/events';

export type LedgerDecision = 'accepted' | 'duplicate' | 'stale';

const MAX_REMEMBERED_EVENTS = 500;

export class EventLedger {
  private readonly seenEventIds = new Set<string>();
  private readonly latestVersions = new Map<string, number>();

  decide(event: RealtimeEvent): LedgerDecision {
    if (this.seenEventIds.has(event.eventId)) return 'duplicate';
    this.remember(event.eventId);

    const resourceKey = `${event.resource}:${event.resourceId}`;
    const latest = this.latestVersions.get(resourceKey) ?? 0;
    if (event.version <= latest) return 'stale';
    this.latestVersions.set(resourceKey, event.version);
    return 'accepted';
  }

  observeVersion(resource: RealtimeEvent['resource'], resourceId: string, version: number): void {
    const resourceKey = `${resource}:${resourceId}`;
    this.latestVersions.set(
      resourceKey,
      Math.max(version, this.latestVersions.get(resourceKey) ?? 0),
    );
  }

  reset(): void {
    this.seenEventIds.clear();
    this.latestVersions.clear();
  }

  private remember(eventId: string): void {
    this.seenEventIds.add(eventId);
    if (this.seenEventIds.size > MAX_REMEMBERED_EVENTS) {
      const oldest = this.seenEventIds.values().next().value;
      if (oldest !== undefined) this.seenEventIds.delete(oldest);
    }
  }
}
