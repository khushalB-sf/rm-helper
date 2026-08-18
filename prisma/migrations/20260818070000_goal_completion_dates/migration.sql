-- Rename dueDate to lastCompletionDate (deadline), and add completionDate (actual completion date)
ALTER TABLE "Goal" RENAME COLUMN "dueDate" TO "lastCompletionDate";
ALTER TABLE "Goal" ADD COLUMN "completionDate" TIMESTAMP(3);
