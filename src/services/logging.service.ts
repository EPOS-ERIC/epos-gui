import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import moment from 'moment-es6';

/**
 * Logging levels
 */
export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

/**
 * Object for defining an log item.
 */
export class LogEntry {

  /**
   * Creates and returns log item.
   *
   * {@link DataConsoleComponent}
   * [Moment]{@link https://momentjs.com/}
   *
   * @param timeStamp Moment object representing the timestamp when the item was created.
   * @param level The level that this log entry has been raised at.
   * @param message The content of the log entry.
   * @param outputToConsole Whether to output this message in the DataConsoleComponent.
   */
  private constructor(
    public readonly timeStamp: moment.Moment,
    public readonly level: LogLevel,
    public readonly message: string,
    public readonly outputToConsole: boolean,
  ) {
  }

  /**
   * Creates and returns log item.
   *
   * {@link DataConsoleComponent}
   *
   * @param level The level that this log entry has been raised at.
   * @param message The content of the log entry.
   * @param outputToConsole Whether to output this message in the DataConsoleComponent.
   */
  static make(
    level: LogLevel,
    message: string,
    outputToConsole: boolean,
  ): LogEntry {
    return new LogEntry(moment(), level, message, outputToConsole);
  }
}

/**
 * Centralised place for creating, storing and retrieving log entries from/to.
 */
// eslint-disable-next-line max-classes-per-file
@Injectable()
export class LoggingService {
  /**
   * {@link LogLevel} at which messages are output to the browser console.
   */
  private readonly BROWSER_CONSOLE_LOG_LEVEL = LogLevel.WARNING;

  private readonly logEntries = new Array<LogEntry>();
  private readonly newConsoleEntrySource = new Subject<LogEntry>();

  /**
   * Creates a DEBUG level log entry.
   * @param message The content of the log entry.
   * @param outputToConsole Whether to output this message in the DataConsoleComponent.
   */
  public debug(message: string, outputToConsole = false): LogEntry {
    return this.log(LogLevel.DEBUG, message, outputToConsole);
  }
  /**
   * Creates a INFO level log entry.
   * @param message The content of the log entry.
   * @param outputToConsole Whether to output this message in the DataConsoleComponent.
   */
  public info(message: string, outputToConsole = false): LogEntry {
    return this.log(LogLevel.INFO, message, outputToConsole);
  }
  /**
   * Creates a WARNING level log entry.
   * @param message The content of the log entry.
   * @param outputToConsole Whether to output this message in the DataConsoleComponent.
   */
  public warn(message: string, outputToConsole = false): LogEntry {
    return this.log(LogLevel.WARNING, message, outputToConsole);
  }
  /**
   * Creates a ERROR level log entry.
   * @param message The content of the log entry.
   * @param outputToConsole Whether to output this message in the DataConsoleComponent.
   */
  public error(message: string, outputToConsole = false): LogEntry {
    return this.log(LogLevel.ERROR, message, outputToConsole);
  }

  /**
   * Convenience method for creating a {@link LogEntry} depending on the result of a Promise.
   *
   * @param promise The Promise that the LogEntry will be created from, when it is resolved.
   * @param message A description of the action.
   * @param successOutputToConsole Whether to output this message in the DataConsoleComponent, on Promise resolve.
   * @param successLevel The level that this log entry has been raised at, on Promise resolve.
   * @param failOutputToConsole Whether to output this message in the DataConsoleComponent, on Promise rejection.
   * @param failLevel The level that this log entry has been raised at, on Promise rejection.
   */
  public logForPromise<T>(
    promise: Promise<T>,
    message: string,
    successOutputToConsole = true,
    successLevel = LogLevel.INFO,
    failOutputToConsole = true,
    failLevel = LogLevel.ERROR,
  ): Promise<T> {
    this.log(successLevel, message, successOutputToConsole);
    return promise
      .then((a: T) => {
        this.log(successLevel, `${message} - SUCCESS`, successOutputToConsole);
        return a;
      })
      .catch((error) => {
        this.log(failLevel, `${message} - FAILED - ${String(error)}`, failOutputToConsole);
        throw (error);
      });
  }

  /**
   * @return An rxjs/Observable that is triggered when a new LogEntry is added.
   */
  public watchNewConsoleEntries(): Observable<LogEntry> {
    return this.newConsoleEntrySource.asObservable();
  }

  /**
   * @return A full Array of LogEntrys that have been added.
   */
  public getConsoleEntries(): Array<LogEntry> {
    return this.logEntries.filter((entry: LogEntry) => {
      return (entry.outputToConsole);
    });
  }

  /**
   * Internal function for craeting {@link LogEntry}s and triggering their output to
   * the browser console and {@link DataConsoleComponent}.
   * @param level The level that this log entry has been raised at.
   * @param message The content of the log entry.
   * @param outputToGuiConsole Whether to output this message in the DataConsoleComponent.
   */
  private log(level: LogLevel, message: string, outputToGuiConsole = false): LogEntry {
    const newLogEntry = LogEntry.make(level, message, outputToGuiConsole);
    this.logEntries.push(newLogEntry);

    if (outputToGuiConsole) {
      this.newConsoleEntrySource.next(newLogEntry);
    }

    if (level >= this.BROWSER_CONSOLE_LOG_LEVEL) {
      console.log(newLogEntry);
    }
    return newLogEntry;
  }

}

// /**
//  * Factory function.
//  * @param router
//  * @param oAuthService
//  */
// export function loggingServiceFactory(injector: Injector) {
//   console.log('MAKE logging');
//   return new LoggingService();
// }

// /**
//  * Provider for injection.
//  */
// export let loggingServiceProvider = {
//   provide: LoggingService,
//   useFactory: loggingServiceFactory,
//   deps: [Injector]
// };
