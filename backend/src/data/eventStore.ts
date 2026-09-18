import fs from 'fs';
import path from 'path';
import { BusinessEvent, BusinessEventType, ReferenceType } from '../events/eventTypes';

const EVENTS_FILE = path.join(__dirname, '../../data/events.json');

class EventDatabase {
  private events: Map<string, BusinessEvent> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const dir = path.dirname(EVENTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(EVENTS_FILE)) {
        const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
        const list: BusinessEvent[] = JSON.parse(raw);
        this.events.clear();
        list.forEach(e => this.events.set(e.eventId, e));
        return;
      }
    } catch (err) {
      console.error('Error reading events.json store:', err);
    }
    this.events.clear();
    this.save();
  }

  public save(): void {
    try {
      const dir = path.dirname(EVENTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.events.values());
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing events.json store:', err);
    }
  }

  public saveEvent(event: BusinessEvent): BusinessEvent {
    this.events.set(event.eventId, event);
    this.save();
    return event;
  }

  public getById(eventId: string): BusinessEvent | null {
    return this.events.get(eventId) || null;
  }

  public has(eventId: string): boolean {
    return this.events.has(eventId);
  }

  public getAll(filter?: {
    eventType?: BusinessEventType;
    referenceType?: ReferenceType;
    referenceId?: string;
    actorUserId?: string;
    limit?: number;
    offset?: number;
  }): BusinessEvent[] {
    let list = Array.from(this.events.values());
    if (filter?.eventType) {
      list = list.filter(e => e.eventType === filter.eventType);
    }
    if (filter?.referenceType) {
      list = list.filter(e => e.referenceType === filter.referenceType);
    }
    if (filter?.referenceId) {
      list = list.filter(e => e.referenceId === filter.referenceId);
    }
    if (filter?.actorUserId) {
      list = list.filter(e => e.actorUserId === filter.actorUserId);
    }
    list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter?.offset !== undefined) {
      list = list.slice(filter.offset);
    }
    if (filter?.limit !== undefined) {
      list = list.slice(0, filter.limit);
    }
    return list;
  }
}

export const eventDb = new EventDatabase();
