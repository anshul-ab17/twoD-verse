-- CreateTable
CREATE TABLE "WorldMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorldMessage_createdAt_idx" ON "WorldMessage"("createdAt");
