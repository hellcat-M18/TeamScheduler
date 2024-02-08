-- CreateTable
CREATE TABLE "users" (
    "userId" TEXT NOT NULL,
    "userName" VARCHAR(255) NOT NULL,
    "partners" TEXT[],
    "invitationUUID" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "schedules" (
    "scheduleId" UUID NOT NULL,
    "scheduleName" VARCHAR(255) NOT NULL,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT NOT NULL,
    "scheduleOwnerId" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("scheduleId")
);

-- CreateIndex
CREATE INDEX "schedules_scheduleId_idx" ON "schedules"("scheduleId");

-- CreateIndex
CREATE INDEX "schedules_scheduleOwnerId_idx" ON "schedules"("scheduleOwnerId");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_scheduleOwnerId_fkey" FOREIGN KEY ("scheduleOwnerId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
