-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REPORTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "commercialStatus" TEXT NOT NULL DEFAULT 'EDITORIAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "authorName" TEXT NOT NULL,
    "authorId" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "StoryTag_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "mediaId" TEXT,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "photographer" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryImage_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RadarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "commercialStatus" TEXT NOT NULL DEFAULT 'EDITORIAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "coverImage" TEXT,
    "eventDate" DATETIME,
    "location" TEXT,
    "link" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" DATETIME,
    "applicationUrl" TEXT,
    "origin" TEXT NOT NULL,
    "commercialStatus" TEXT NOT NULL DEFAULT 'EDITORIAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "contact" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiser" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "creativeUrl" TEXT,
    "targetUrl" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Story_contentType_status_idx" ON "Story"("contentType", "status");

-- CreateIndex
CREATE INDEX "StoryTag_storyId_idx" ON "StoryTag"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryTag_storyId_tag_key" ON "StoryTag"("storyId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "StoryImage_mediaId_key" ON "StoryImage"("mediaId");

-- CreateIndex
CREATE INDEX "StoryImage_storyId_displayOrder_idx" ON "StoryImage"("storyId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RadarItem_slug_key" ON "RadarItem"("slug");

-- CreateIndex
CREATE INDEX "RadarItem_status_publishedAt_idx" ON "RadarItem"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_slug_key" ON "Opportunity"("slug");

-- CreateIndex
CREATE INDEX "Opportunity_status_deadline_idx" ON "Opportunity"("status", "deadline");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdCampaign_status_startsAt_endsAt_idx" ON "AdCampaign"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");
