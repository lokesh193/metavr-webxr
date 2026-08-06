-- Complete Database Schema Migration for METAVR WebXR Platform on Supabase PostgreSQL

-- 1. Create User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Project Table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL DEFAULT 'MODEL',
    "thumbnail" TEXT,
    "glbUrl" TEXT,
    "unityUrls" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "views" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create File Table
CREATE TABLE IF NOT EXISTS "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Comment Table
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Like Table
CREATE TABLE IF NOT EXISTS "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_userId_projectId_key" UNIQUE ("userId", "projectId")
);

-- 6. Create Favorite Table
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_projectId_key" UNIQUE ("userId", "projectId")
);

-- 7. Create Follow Table
CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "followingId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_followerId_followingId_key" UNIQUE ("followerId", "followingId")
);

-- 8. Seed Default Creator User if missing
INSERT INTO "User" ("id", "email", "name", "password", "role")
VALUES ('user_demo_creator_123', 'user@vrplatform.dev', 'WebXR Creator', '$2a$10$7R15mZ5H1234567890abcdefghijklmnopqrstuvwxyz', 'USER')
ON CONFLICT ("email") DO NOTHING;

-- 9. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "File" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Follow" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select User" ON "User";
CREATE POLICY "Public Select User" ON "User" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert User" ON "User";
CREATE POLICY "Public Insert User" ON "User" FOR INSERT TO public, anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Project" ON "Project";
CREATE POLICY "Public Select Project" ON "Project" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert Project" ON "Project";
CREATE POLICY "Public Insert Project" ON "Project" FOR INSERT TO public, anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Project" ON "Project";
CREATE POLICY "Public Update Project" ON "Project" FOR UPDATE TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Delete Project" ON "Project";
CREATE POLICY "Public Delete Project" ON "Project" FOR DELETE TO public, anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Select File" ON "File";
CREATE POLICY "Public Select File" ON "File" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert File" ON "File";
CREATE POLICY "Public Insert File" ON "File" FOR INSERT TO public, anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Comment" ON "Comment";
CREATE POLICY "Public Select Comment" ON "Comment" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert Comment" ON "Comment";
CREATE POLICY "Public Insert Comment" ON "Comment" FOR INSERT TO public, anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Like" ON "Like";
CREATE POLICY "Public Select Like" ON "Like" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert Like" ON "Like";
CREATE POLICY "Public Insert Like" ON "Like" FOR INSERT TO public, anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Favorite" ON "Favorite";
CREATE POLICY "Public Select Favorite" ON "Favorite" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert Favorite" ON "Favorite";
CREATE POLICY "Public Insert Favorite" ON "Favorite" FOR INSERT TO public, anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Follow" ON "Follow";
CREATE POLICY "Public Select Follow" ON "Follow" FOR SELECT TO public, anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public Insert Follow" ON "Follow";
CREATE POLICY "Public Insert Follow" ON "Follow" FOR INSERT TO public, anon, authenticated WITH CHECK (true);
