/**
 * Fix admin user password hash in database
 */
const { neon } = require('@neondatabase/serverless');

const databaseUrl = 'postgresql://neondb_owner:npg_seAfu6Uobn9m@ep-curly-feather-b5a5sx3d-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function fixAdminPassword() {
  try {
    const email = 'shaikroshan6789@gmail.com';
    const passwordHash = '$2a$10$YHxbTP40cUNOQqyK6yT8huPV5KK4NSYVJTnvcKCuyI0LglgdgEd52'; // roshan885 hashed

    console.log(`Updating admin user password hash for: ${email}`);

    const result = await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE email = ${email}
      RETURNING id, email, name, role;
    `;

    if (result.length === 0) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Admin password hash updated successfully');
    console.log('User:', result[0]);
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    process.exit(1);
  }
}

fixAdminPassword();
