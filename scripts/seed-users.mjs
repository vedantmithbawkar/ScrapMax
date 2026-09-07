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
console.log('🌱 SAMPAH JUJUR - SUPABASE USER & DATA SEEDING UTILITY');
console.log('========================================================');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key Present:', !!serviceRoleKey);

if (!serviceRoleKey) {
  console.log('\n⚠️  SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local.');
  console.log('\nTo seed demo users automatically from this script:');
  console.log('1. Go to your Supabase Project Dashboard:');
  console.log('   https://supabase.com/dashboard/project/qaoczojfnraivdhbxsab/settings/api');
  console.log('2. Under "Project API keys", copy the "service_role" secret key.');
  console.log('3. Add it to .env.local:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.log('4. Run this script again: npm run seed');
  console.log('\n--------------------------------------------------------');
  console.log('💡 OR CREATE THE DEMO USER DIRECTLY IN SUPABASE DASHBOARD:');
  console.log('1. Go to: https://supabase.com/dashboard/project/qaoczojfnraivdhbxsab/auth/users');
  console.log('2. Click "Add user" -> "Create user"');
  console.log('3. Email: household@sampahjujur.demo');
  console.log('4. Password: demo123456');
  console.log('5. Check "Auto Confirm User"');
  console.log('6. Click "Create user"');
  console.log('--------------------------------------------------------\n');
  process.exit(0);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('\n1. Creating or verifying Household Demo User (household@sampahjujur.demo)...');
  const { data: householdUser, error: hError } = await adminSupabase.auth.admin.createUser({
    email: 'household@sampahjujur.demo',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Sahil Doe',
      role: 'household',
      phone: '+91 9876543210',
    },
  });

  let householdId = householdUser?.user?.id;
  if (hError) {
    if (hError.message.includes('already been registered') || hError.message.includes('already exists')) {
      console.log('ℹ️ household@sampahjujur.demo already exists. Fetching user...');
      const { data: list } = await adminSupabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === 'household@sampahjujur.demo');
      householdId = existing?.id;
    } else {
      console.error('❌ Error creating household user:', hError.message);
    }
  } else {
    console.log('✔ Household user created successfully! ID:', householdId);
  }

  if (householdId) {
    await adminSupabase.from('profiles').upsert({
      id: householdId,
      full_name: 'Sahil Doe',
      role: 'household',
      phone: '+91 9876543210',
    });
    console.log('✔ Profile row upserted for Household user.');
  }

  console.log('\n2. Creating or verifying Collector Demo User (collector@sampahjujur.demo)...');
  const { data: collectorUser, error: cError } = await adminSupabase.auth.admin.createUser({
    email: 'collector@sampahjujur.demo',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Budi Santoso',
      role: 'collector',
      phone: '+91 9123456780',
    },
  });

  let collectorId = collectorUser?.user?.id;
  if (cError) {
    if (cError.message.includes('already been registered') || cError.message.includes('already exists')) {
      console.log('ℹ️ collector@sampahjujur.demo already exists. Fetching user...');
      const { data: list } = await adminSupabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === 'collector@sampahjujur.demo');
      collectorId = existing?.id;
    } else {
      console.error('❌ Error creating collector user:', cError.message);
    }
  } else {
    console.log('✔ Collector user created successfully! ID:', collectorId);
  }

  if (collectorId) {
    await adminSupabase.from('profiles').upsert({
      id: collectorId,
      full_name: 'Budi Santoso',
      role: 'collector',
      phone: '+91 9123456780',
    });
    console.log('✔ Profile row upserted for Collector user.');
  }

  if (householdId) {
    console.log('\n3. Seeding sample Pickup Requests and Waste Items in Supabase...');
    const { data: req, error: reqErr } = await adminSupabase
      .from('pickup_requests')
      .insert({
        household_id: householdId,
        status: 'pending',
        address: 'Indiranagar 100ft Road, Bangalore, Karnataka',
        latitude: 12.9784,
        longitude: 77.6408,
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: 'Cardboard boxes and plastic bottles bundled near the gate.',
        total_estimated_weight_kg: 14.5,
      })
      .select()
      .single();

    if (reqErr) {
      console.error('❌ Error inserting pickup request:', reqErr.message);
    } else if (req) {
      console.log('✔ Sample pickup request created in Supabase! Request ID:', req.id);
      const { error: wErr } = await adminSupabase.from('waste_items').insert([
        {
          request_id: req.id,
          category: 'PAPER',
          approx_weight_kg: 8.5,
          notes: 'Bundled newspapers and cardboard boxes',
        },
        {
          request_id: req.id,
          category: 'PLASTIC',
          approx_weight_kg: 6.0,
          notes: 'Cleaned PET bottles',
        },
      ]);
      if (wErr) {
        console.error('❌ Error inserting waste items:', wErr.message);
      } else {
        console.log('✔ Sample waste items linked and inserted successfully!');
      }
    }
  }

  console.log('\n========================================================');
  console.log('🎉 SEEDING COMPLETE!');
  console.log('You can now log in directly at http://localhost:3000/login using:');
  console.log('  Email: household@sampahjujur.demo');
  console.log('  Password: demo123456');
  console.log('========================================================\n');
}

seed().catch(console.error);
