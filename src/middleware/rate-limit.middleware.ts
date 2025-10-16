import rateLimit from "express-rate-limit";

export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string
) => {
  if (process.env.NODE_ENV === "test") {
    return (req: any, res: any, next: any) => next();
  }

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many authentication attempts, please try again later."
);
export const transferLimiter = createRateLimiter(
  60 * 60 * 1000,
  10,
  "Too many transfer attempts, please try again later."
);
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  "Too many requests, please try again later."
);
