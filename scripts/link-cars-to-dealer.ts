import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nhlnbpylatlcdiutnsef.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5obG5icHlsYXRsY2RpdXRuc2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQyMDQ2MywiZXhwIjoyMDk5OTk2NDYzfQ.dNv-xkw65L-UGUBcxGo3B3I-s_yc7eclPFSBEJ19ZBo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Fetching dealer users from public.users...');
  const { data: users } = await supabase
    .from('users')
    .select('id, auth_user_id, email, name, role, phone');

  const primaryDealer = users?.find(u => u.role === 'seller') || users?.[0];
  if (!primaryDealer) {
    console.error('No dealer found!');
    process.exit(1);
  }

  console.log(`\nLinking ALL 25 cars to Primary Dealer:`);
  console.log(`Name: ${primaryDealer.name}`);
  console.log(`Email: ${primaryDealer.email}`);
  console.log(`ID: ${primaryDealer.id}`);

  // Fetch all car IDs
  const { data: cars } = await supabase.from('cars').select('id');
  const allCarIds = (cars || []).map(c => c.id);

  console.log(`Found ${allCarIds.length} car IDs.`);

  // Update seller_id, seller_name, seller_phone on all cars
  const { error: err1 } = await supabase
    .from('cars')
    .update({
      seller_id: primaryDealer.id,
      seller_name: primaryDealer.name || 'Apex Performance Motors',
      seller_phone: primaryDealer.phone || '07911 123456',
    })
    .in('id', allCarIds);

  if (err1) {
    console.warn('Update with seller_id error:', err1.message);
    const { error: err2 } = await supabase
      .from('cars')
      .update({
        seller_name: primaryDealer.name || 'Apex Performance Motors',
        seller_phone: primaryDealer.phone || '07911 123456',
      })
      .in('id', allCarIds);

    if (err2) {
      console.error('Update with seller_name error:', err2.message);
    } else {
      console.log('Successfully updated seller_name and seller_phone!');
    }
  } else {
    console.log('SUCCESS! Linked ALL 25 car listings to dealer seller_id, seller_name, and seller_phone!');
  }
}

main();
