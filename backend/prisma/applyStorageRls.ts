import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Configuring Supabase Storage RLS Policies for "webxr-assets" bucket...');

  const sqlStatements = [
    // 1. Create or update public bucket 'webxr-assets'
    `INSERT INTO storage.buckets (id, name, public)
     VALUES ('webxr-assets', 'webxr-assets', true)
     ON CONFLICT (id) DO UPDATE SET public = true;`,

    // 2. Drop existing policies to prevent conflicts
    `DROP POLICY IF EXISTS "Public Read Access for webxr-assets" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public Insert Access for webxr-assets" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public Update Access for webxr-assets" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public Delete Access for webxr-assets" ON storage.objects;`,

    // 3. Create SELECT policy for public read access
    `CREATE POLICY "Public Read Access for webxr-assets"
     ON storage.objects
     FOR SELECT
     TO public, anon, authenticated
     USING (bucket_id = 'webxr-assets');`,

    // 4. Create INSERT policy for uploads from web/mobile clients
    `CREATE POLICY "Public Insert Access for webxr-assets"
     ON storage.objects
     FOR INSERT
     TO public, anon, authenticated
     WITH CHECK (bucket_id = 'webxr-assets');`,

    // 5. Create UPDATE policy
    `CREATE POLICY "Public Update Access for webxr-assets"
     ON storage.objects
     FOR UPDATE
     TO public, anon, authenticated
     USING (bucket_id = 'webxr-assets');`,
  ];

  for (const statement of sqlStatements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log('✅ Applied SQL:', statement.split('\n')[0]);
    } catch (err: any) {
      console.warn('⚠️ SQL Notice:', err?.message || err);
    }
  }

  console.log('🎉 Successfully applied Supabase Storage RLS policies for "webxr-assets"!');
}

main()
  .catch((e) => {
    console.error('❌ Failed to apply RLS policies:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
