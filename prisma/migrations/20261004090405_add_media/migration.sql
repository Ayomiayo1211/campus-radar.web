-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'image',
    "format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "originalName" TEXT,
    "altText" TEXT,
    "folder" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");
