/**
 * Seed admin user into database
 * Run with: node scripts/seed-admin.js
 */

const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get credentials from .env
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = 'Admin User';
    const phone = '9876543210';
    
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    }
    
    console.log('Creating admin user...');
    console.log('Email:', email);
    
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      console.log('✓ Admin user already exists');
      pool.end();
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (role, name, email, password_hash, phone, phone_verified, phone_verified_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, role`,
      ['admin', name, email, passwordHash, phone, true]
    );
    
    console.log('✓ Admin user created successfully');
    console.log('User ID:', result.rows[0].id);
    console.log('Email:', result.rows[0].email);
    console.log('Role:', result.rows[0].role);
    
    pool.end();
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    pool.end();
    process.exit(1);
  }
}

seedAdmin();
