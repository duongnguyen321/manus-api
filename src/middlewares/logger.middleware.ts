import colors from 'ansi-colors';
import type { Request, Response } from 'express';
import morgan from 'morgan';
import moment from 'moment';

export function useRequestLogging(app) {
  // Custom token for logging the user from req.user
  morgan.token('user', (req: Request) => {
    // Check if req.user exists and has a username or id property
    if (req.user && (req.user.name || req.user.id)) {
      return `${req.user.role}: ${req.user.name} - ${req.user.id}`;
    }
    return null;
  });

  // Custom token for logging errors
  morgan.token('error', (req: Request, res: Response) => {
    return res.statusCode >= 400 ? `Error: ${res.statusMessage}` : null;
  });

  app.use(
    morgan(
      (tokens, req: Request, res: Response) => {
        const path = req.url;
        if (['/docs', '/swagger', '/favicon'].some((p) => path.startsWith(p))) {
          return;
        }
        const status = tokens.status(req, res);
        const method = tokens.method(req, res);
        const user = tokens.user(req, res);
        const error = tokens.error(req, res);
        const responseTime = tokens['response-time'](req, res);
        const timestamp = moment().utc().format('DD/MM/YYYY HH:mm:ss [GMT]Z'); // Include timezone
        const colorMethod = error ? colors.red : colors.blue;
        const colorStatus = error ? colors.red : colors.green;
        return [
          colors.gray(`[${timestamp}]`), // Add timestamp with gray color
          colorMethod(`[${method}]`),
          colorStatus(`[${status}]`),
          colors.cyan(`[${path}]`),
          colors.yellow(`[${responseTime}ms]`),
          colors.magenta(user ? `[${user}]` : undefined),
          colors.red(error ? `${error}` : undefined),
        ].join(' ');
      },
      {
        stream: {
          write: console.log,
        },
      },
    ),
  );
}
