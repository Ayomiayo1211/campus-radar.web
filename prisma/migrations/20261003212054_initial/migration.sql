-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REPORTER',
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
CREATE TABLE "RadarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "commercialStatus" TEXT NOT NULL DEFAULT 'EDITORIAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StoryTag_storyId_tag_key" ON "StoryTag"("storyId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "RadarItem_slug_key" ON "RadarItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_slug_key" ON "Opportunity"("slug");
