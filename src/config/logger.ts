import pino from "pino";
import { env } from "./env";
import fs from "fs";

if (!fs.existsSync("./logs")) {
  fs.mkdirSync("./logs");
}

const streams = [
  {
    stream:
      env.NODE_ENV !== "production"
        ? pino.transport({
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          })
        : process.stdout,
  },
  {
    stream: pino.destination({
      dest: "./logs/app.log",
      sync: false,
    }),
  },
];

const logger = pino(
  { level: env.NODE_ENV === "production" ? "info" : "debug" },
  pino.multistream(streams)
);

export default logger;
