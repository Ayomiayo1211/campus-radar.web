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

-- CreateIndex
CREATE UNIQUE INDEX "StoryImage_mediaId_key" ON "StoryImage"("mediaId");

-- CreateIndex
CREATE INDEX "StoryImage_storyId_displayOrder_idx" ON "StoryImage"("storyId", "displayOrder");

-- CreateIndex
CREATE INDEX "AdCampaign_status_startsAt_endsAt_idx" ON "AdCampaign"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Opportunity_status_deadline_idx" ON "Opportunity"("status", "deadline");

-- CreateIndex
CREATE INDEX "RadarItem_status_publishedAt_idx" ON "RadarItem"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Story_contentType_status_idx" ON "Story"("contentType", "status");

-- CreateIndex
CREATE INDEX "StoryTag_storyId_idx" ON "StoryTag"("storyId");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");
