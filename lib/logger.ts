/**
 * Logger Utility
 *
 * Provides structured logging with context, correlation IDs, and multiple levels.
 * Can be extended to integrate with logging services like Datadog, New Relic, etc.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  correlationId?: string
  userId?: string
  teamId?: string
  requestId?: string
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
  timestamp: Date
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO
  private context: LogContext = {}

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * Set global context that will be included in all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {}
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.minLevel = this.minLevel
    childLogger.context = { ...this.context, ...context }
    return childLogger
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentIndex = levels.indexOf(this.minLevel)
    const messageIndex = levels.indexOf(level)
    return messageIndex >= currentIndex
  }

  /**
   * Format and output a log entry
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const logData = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp.toISOString(),
      ...this.context,
      ...entry.context,
    }

    if (entry.error) {
      logData.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      }
    }

    // In production, this could send to a logging service
    // For now, we use console with appropriate methods
    const consoleMethod = entry.level === LogLevel.ERROR ? 'error' :
                         entry.level === LogLevel.WARN ? 'warn' : 'log'

    console[consoleMethod](JSON.stringify(logData, null, 2))
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      context,
      timestamp: new Date(),
    })
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log({
      level: LogLevel.INFO,
      message,
      context,
      timestamp: new Date(),
    })
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log({
      level: LogLevel.WARN,
      message,
      context,
      timestamp: new Date(),
    })
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      error,
      context,
      timestamp: new Date(),
    })
  }

  /**
   * Time an operation and log the duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now()
    this.debug(`Starting: ${operation}`, context)

    try {
      const result = await fn()
      const duration = Date.now() - start
      this.info(`Completed: ${operation}`, { ...context, durationMs: duration })
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.error(
        `Failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        { ...context, durationMs: duration }
      )
      throw error
    }
  }
}

// Global logger instance
export const logger = new Logger()

// Set log level from environment
const envLogLevel = process.env.LOG_LEVEL?.toLowerCase()
if (envLogLevel && Object.values(LogLevel).includes(envLogLevel as LogLevel)) {
  logger.setLevel(envLogLevel as LogLevel)
}
