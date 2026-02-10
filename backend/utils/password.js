import crypto from "crypto";

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = "sha512";

export const hashPassword = (password) => {
  if (!password) throw new Error("Password is required");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");

  return {
    salt,
    hash,
    iterations: ITERATIONS,
    keylen: KEYLEN,
    digest: DIGEST,
  };
};

export const verifyPassword = (password, stored) => {
  if (!password || !stored?.salt || !stored?.hash) return false;

  const hash = crypto
    .pbkdf2Sync(
      password,
      stored.salt,
      stored.iterations || ITERATIONS,
      stored.keylen || KEYLEN,
      stored.digest || DIGEST
    )
    .toString("hex");

  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(stored.hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};
