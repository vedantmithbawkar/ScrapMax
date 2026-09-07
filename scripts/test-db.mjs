import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';
const serviceRoleKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : '';

console.log('========================================================');
console.log('🔍 SAMPAH JUJUR - DATABASE INSERT & CONNECTIVITY TEST');
console.log('========================================================');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key Present:', !!supabaseAnonKey);
console.log('Service Role Key Present:', !!serviceRoleKey);
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  // 1. Connection & Read Test
  console.log('Step 1: Testing Connection & Table Read Access...');
  const t0 = Date.now();
  const { data: reqs, error: readErr } = await supabase
    .from('pickup_requests')
    .select('*')
    .limit(5);

  if (readErr) {
    console.error('❌ Failed to read pickup_requests table:', readErr.message);
  } else {
    console.log(`✔ Read Successful! Latency: ${Date.now() - t0}ms. Rows found: ${reqs.length}`);
  }

  // 2. Direct Insert Test with Anon Key
  console.log('\nStep 2: Testing Direct DB Insert with Anon Key...');
  const testPayload = {
    household_id: '00000000-0000-0000-0000-000000000000',
    address: 'Indiranagar 100ft Rd, Bangalore (Test Insert)',
    latitude: 12.9784,
    longitude: 77.6408,
    scheduled_date: '2026-09-10',
    notes: 'Automated test pickup entry',
    total_estimated_weight_kg: 15.0,
    status: 'pending',
  };

  const { data: insertData, error: insertErr } = await supabase
    .from('pickup_requests')
    .insert(testPayload)
    .select();

  if (insertErr) {
    console.log('ℹ️ Direct Anon Insert Result:');
    console.log(`   PostgreSQL Code: ${insertErr.code}`);
    console.log(`   Database Message: "${insertErr.message}"`);
    console.log('\n   [Explanation]:');
    console.log('   The request successfully reached the PostgreSQL database!');
    console.log('   PostgreSQL evaluated Row Level Security (RLS) policies:');
    console.log('   Only authenticated household users (auth.uid() = household_id)');
    console.log('   are permitted to insert into pickup_requests.');
  } else {
    console.log('✔ Direct Insert Succeeded! Row ID:', insertData[0]?.id);
  }

  // 3. Service Role Key or Authenticated Insert if available
  if (serviceRoleKey) {
    console.log('\nStep 3: Service Role Key detected! Running Admin Write Verification...');
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Create or find a test profile
    const testUserId = '11111111-1111-1111-1111-111111111111';
    await adminSupabase.from('profiles').upsert({
      id: testUserId,
      full_name: 'Test Household User',
      role: 'household',
      phone: '+919999999999',
    });

    const adminPayload = {
      household_id: testUserId,
      address: 'Test Verified Location, Bangalore',
      latitude: 12.9716,
      longitude: 77.5946,
      scheduled_date: '2026-09-15',
      notes: 'Verified DB write test',
      total_estimated_weight_kg: 25.5,
      status: 'pending',
    };

    const { data: writeData, error: writeErr } = await adminSupabase
      .from('pickup_requests')
      .insert(adminPayload)
      .select()
      .single();

    if (writeErr) {
      console.error('❌ Admin write failed:', writeErr.message);
    } else {
      console.log('🎉 SUCCESS! Record written to Supabase PostgreSQL!');
      console.log('   Inserted Row ID:', writeData.id);
      console.log('   Address:', writeData.address);
      console.log('   Scheduled Date:', writeData.scheduled_date);
      console.log('   Total Weight:', writeData.total_estimated_weight_kg, 'kg');

      // Verify read-back
      const { data: readBack } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('id', writeData.id)
        .single();

      console.log('✔ Read-back verification from DB:', readBack ? 'CONFIRMED' : 'FAILED');
    }
  } else {
    console.log('\n--------------------------------------------------------');
    console.log('💡 How to perform an end-to-end write right now:');
    console.log('Option A: In Supabase Dashboard > Authentication > Providers > Email,');
    console.log('          turn OFF "Confirm email". Then register/login in the app.');
    console.log('Option B: Copy your "service_role" key from Supabase Dashboard');
    console.log('          (Settings > API > Project API Keys > service_role)');
    console.log('          and add to .env.local: SUPABASE_SERVICE_ROLE_KEY=...');
    console.log('--------------------------------------------------------');
  }
}

runTest().catch(console.error);
