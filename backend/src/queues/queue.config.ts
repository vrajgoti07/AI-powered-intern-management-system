import { Queue, QueueOptions } from "bullmq";
import redis from "../config/redis";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

const queueOptions: QueueOptions = {
  connection: redis as any, // Fix BullMQ + ioredis type conflict

  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

export const emailQueue = new Queue(
  "emailQueue",
  queueOptions
);

export const reportQueue = new Queue(
  "reportQueue",
  queueOptions
);

export const notificationQueue = new Queue(
  "notificationQueue",
  queueOptions
);

export const submissionQueue = new Queue(
  "submissionQueue",
  queueOptions
);

export const NOTIFICATION_QUEUE_NAME =
  "notificationQueue";

// Bull Board
export const serverAdapter =
  new ExpressAdapter();

serverAdapter.setBasePath(
  "/admin/queues"
);

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(reportQueue),
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(submissionQueue),
  ],

  serverAdapter,
});