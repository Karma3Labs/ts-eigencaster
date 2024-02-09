import { Logger, ILogObj } from "tslog";

enum LogLevelEnum {
  silly = 0,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
}

export function getLogger(name: string): Logger<ILogObj> {
  const log_level:any = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  const minLevel:number = +LogLevelEnum[log_level];
  return new Logger({ name: name, minLevel: minLevel });
}