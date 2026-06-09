#!/usr/bin/env node
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const nextCachePath = resolve(process.cwd(), "apps/web/.next");

await rm(nextCachePath, { force: true, recursive: true });
