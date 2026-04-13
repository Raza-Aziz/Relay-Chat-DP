/**
 * EventBus — Observer (Pub/Sub) Pattern
 * 
 * Decouples business logic from socket transport.
 * Components publish events; the socket layer subscribes and
 * handles broadcasting to connected clients.
 * 
 * This implements the classic Observer pattern where:
 * - Publishers (route handlers, listeners) emit events without knowing who listens
 * - Subscribers (socket emitters) react to events without knowing who published them
 */

type EventCallback = (...args: any[]) => void;

class EventBus {
  private static instance: EventBus | null = null;
  private subscribers: Map<string, EventCallback[]> = new Map();

  private constructor() {}

  /** Singleton access */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event topic.
   * Returns an unsubscribe function for cleanup.
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Publish an event to all subscribers.
   */
  publish(event: string, ...args: any[]): void {
    const callbacks = this.subscribers.get(event);
    if (!callbacks || callbacks.length === 0) {
      return;
    }
    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (err) {
        console.error(`EventBus: Error in subscriber for "${event}":`, err);
      }
    });
  }

  /**
   * Remove all subscribers for a given event (or all events).
   */
  clear(event?: string): void {
    if (event) {
      this.subscribers.delete(event);
    } else {
      this.subscribers.clear();
    }
  }

  /** Get count of subscribers for an event (useful for debugging). */
  subscriberCount(event: string): number {
    return this.subscribers.get(event)?.length || 0;
  }
}

export default EventBus;
