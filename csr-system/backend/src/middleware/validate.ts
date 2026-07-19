import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/** Validates { body, params, query } against a Zod schema and replaces req.body with the parsed result. */
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse({ body: req.body, params: req.params, query: req.query });
    if (parsed.body) req.body = parsed.body;
    next();
  };
}
