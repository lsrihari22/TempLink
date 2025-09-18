-- CreateTable
CREATE TABLE "public"."files" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxDownloads" INTEGER NOT NULL DEFAULT 1,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_token_key" ON "public"."files"("token");

-- CreateIndex
CREATE INDEX "files_token_idx" ON "public"."files"("token");

-- CreateIndex
CREATE INDEX "files_expiresAt_idx" ON "public"."files"("expiresAt");
