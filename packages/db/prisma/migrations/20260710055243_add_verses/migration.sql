-- CreateTable
CREATE TABLE "Verse" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'office',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerseMember" (
    "id" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerseMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerseInvite" (
    "id" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerseInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verse_hash_key" ON "Verse"("hash");

-- CreateIndex
CREATE INDEX "VerseMember_userId_idx" ON "VerseMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerseMember_verseId_userId_key" ON "VerseMember"("verseId", "userId");

-- CreateIndex
CREATE INDEX "VerseInvite_verseId_idx" ON "VerseInvite"("verseId");

-- AddForeignKey
ALTER TABLE "VerseMember" ADD CONSTRAINT "VerseMember_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerseMember" ADD CONSTRAINT "VerseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerseInvite" ADD CONSTRAINT "VerseInvite_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
