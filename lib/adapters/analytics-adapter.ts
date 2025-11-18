/**
 * Analytics Adapter Interface
 *
 * Provides a pluggable interface for tracking metrics and analytics events.
 * Implementations can integrate with services like Google Analytics, Mixpanel,
 * Segment, Amplitude, or custom analytics platforms.
 */

export enum AnalyticsEventType {
  // User actions
  GUIDE_VIEWED = 'guide_viewed',
  QUEST_STARTED = 'quest_started',
  QUEST_COMPLETED = 'quest_completed',
  TEMPLATE_USED = 'template_used',

  // System metrics
  GUIDE_GENERATED = 'guide_generated',
  GUIDE_GENERATION_FAILED = 'guide_generation_failed',
  REPO_ANALYZED = 'repo_analyzed',
  API_REQUEST = 'api_request',

  // Business metrics
  MEMBER_ONBOARDED = 'member_onboarded',
  TEAM_CREATED = 'team_created',
}

export interface AnalyticsEvent {
  type: AnalyticsEventType
  userId?: string
  teamId?: string
  properties?: Record<string, unknown>
  timestamp?: Date
}

export interface AnalyticsMetric {
  name: string
  value: number
  unit?: string
  labels?: Record<string, string>
  timestamp?: Date
}

/**
 * Base interface for analytics adapters
 */
export interface IAnalyticsAdapter {
  /**
   * Track an analytics event
   */
  trackEvent(event: AnalyticsEvent): Promise<void>

  /**
   * Record a metric value
   */
  recordMetric(metric: AnalyticsMetric): Promise<void>

  /**
   * Track multiple events in batch
   */
  trackBatch(events: AnalyticsEvent[]): Promise<void>

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels?: Record<string, string>): Promise<void>

  /**
   * Record timing/duration
   */
  recordTiming(name: string, durationMs: number, labels?: Record<string, string>): Promise<void>

  /**
   * Flush any pending analytics data
   */
  flush(): Promise<void>
}

/**
 * In-memory analytics adapter (for development/testing)
 */
export class InMemoryAnalyticsAdapter implements IAnalyticsAdapter {
  private events: AnalyticsEvent[] = []
  private metrics: AnalyticsMetric[] = []

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date(),
    }
    this.events.push(eventWithTimestamp)

    console.log('[InMemoryAnalyticsAdapter] Event tracked:', {
      type: event.type,
      userId: event.userId,
      teamId: event.teamId,
    })
  }

  async recordMetric(metric: AnalyticsMetric): Promise<void> {
    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date(),
    }
    this.metrics.push(metricWithTimestamp)

    console.log('[InMemoryAnalyticsAdapter] Metric recorded:', {
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
    })
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.trackEvent(e)))
  }

  async incrementCounter(name: string, labels?: Record<string, string>): Promise<void> {
    await this.recordMetric({
      name,
      value: 1,
      unit: 'count',
      labels,
    })
  }

  async recordTiming(
    name: string,
    durationMs: number,
    labels?: Record<string, string>
  ): Promise<void> {
    await this.recordMetric({
      name,
      value: durationMs,
      unit: 'ms',
      labels,
    })
  }

  async flush(): Promise<void> {
    // No-op for in-memory adapter
  }

  /**
   * Get all tracked events (for testing)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Get all recorded metrics (for testing)
   */
  getMetrics(): AnalyticsMetric[] {
    return [...this.metrics]
  }

  /**
   * Get event count by type
   */
  getEventCount(type?: AnalyticsEventType): number {
    if (type) {
      return this.events.filter((e) => e.type === type).length
    }
    return this.events.length
  }

  /**
   * Get metric sum by name
   */
  getMetricSum(name: string): number {
    return this.metrics.filter((m) => m.name === name).reduce((sum, m) => sum + m.value, 0)
  }

  /**
   * Clear all events and metrics (for testing)
   */
  clear(): void {
    this.events = []
    this.metrics = []
  }
}

/**
 * Console analytics adapter (logs to console)
 */
export class ConsoleAnalyticsAdapter implements IAnalyticsAdapter {
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    console.log('[Analytics Event]', {
      type: event.type,
      userId: event.userId,
      teamId: event.teamId,
      properties: event.properties,
      timestamp: event.timestamp || new Date(),
    })
  }

  async recordMetric(metric: AnalyticsMetric): Promise<void> {
    console.log('[Analytics Metric]', {
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      labels: metric.labels,
      timestamp: metric.timestamp || new Date(),
    })
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    console.log('[Analytics Batch]', { eventCount: events.length })
    await Promise.all(events.map((e) => this.trackEvent(e)))
  }

  async incrementCounter(name: string, labels?: Record<string, string>): Promise<void> {
    console.log('[Analytics Counter]', { name, increment: 1, labels })
  }

  async recordTiming(
    name: string,
    durationMs: number,
    labels?: Record<string, string>
  ): Promise<void> {
    console.log('[Analytics Timing]', { name, duration: `${durationMs}ms`, labels })
  }

  async flush(): Promise<void> {
    console.log('[Analytics] Flushed')
  }
}

/**
 * Composite analytics adapter (sends to multiple adapters)
 */
export class CompositeAnalyticsAdapter implements IAnalyticsAdapter {
  constructor(private adapters: IAnalyticsAdapter[]) {}

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    await Promise.allSettled(this.adapters.map((a) => a.trackEvent(event)))
  }

  async recordMetric(metric: AnalyticsMetric): Promise<void> {
    await Promise.allSettled(this.adapters.map((a) => a.recordMetric(metric)))
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    await Promise.allSettled(this.adapters.map((a) => a.trackBatch(events)))
  }

  async incrementCounter(name: string, labels?: Record<string, string>): Promise<void> {
    await Promise.allSettled(this.adapters.map((a) => a.incrementCounter(name, labels)))
  }

  async recordTiming(
    name: string,
    durationMs: number,
    labels?: Record<string, string>
  ): Promise<void> {
    await Promise.allSettled(this.adapters.map((a) => a.recordTiming(name, durationMs, labels)))
  }

  async flush(): Promise<void> {
    await Promise.allSettled(this.adapters.map((a) => a.flush()))
  }

  /**
   * Add an adapter to the composite
   */
  addAdapter(adapter: IAnalyticsAdapter): void {
    this.adapters.push(adapter)
  }
}

/**
 * Analytics service
 */
export class AnalyticsService {
  constructor(private adapter: IAnalyticsAdapter = new InMemoryAnalyticsAdapter()) {}

  /**
   * Set the analytics adapter
   */
  setAdapter(adapter: IAnalyticsAdapter): void {
    this.adapter = adapter
  }

  /**
   * Track an event
   */
  async track(
    type: AnalyticsEventType,
    properties?: Record<string, unknown>,
    userId?: string,
    teamId?: string
  ): Promise<void> {
    await this.adapter.trackEvent({
      type,
      properties,
      userId,
      teamId,
      timestamp: new Date(),
    })
  }

  /**
   * Record a metric
   */
  async metric(
    name: string,
    value: number,
    unit?: string,
    labels?: Record<string, string>
  ): Promise<void> {
    await this.adapter.recordMetric({
      name,
      value,
      unit,
      labels,
      timestamp: new Date(),
    })
  }

  /**
   * Increment a counter
   */
  async increment(name: string, labels?: Record<string, string>): Promise<void> {
    await this.adapter.incrementCounter(name, labels)
  }

  /**
   * Time an operation
   */
  async time<T>(
    name: string,
    operation: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await operation()
      const duration = Date.now() - start
      await this.adapter.recordTiming(name, duration, labels)
      return result
    } catch (error) {
      const duration = Date.now() - start
      await this.adapter.recordTiming(name, duration, {
        ...labels,
        error: 'true',
      })
      throw error
    }
  }

  /**
   * Flush pending analytics
   */
  async flush(): Promise<void> {
    await this.adapter.flush()
  }
}

// Global analytics service instance
export const analyticsService = new AnalyticsService()
