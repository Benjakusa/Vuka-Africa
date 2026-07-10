const prompt_sql = `-- Fix the trigger function - the enum is in public schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public."User" (id, email, phone, "fullName", role, "lastLoginAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public."UserRole", 'TRAINEE'::public."UserRole"),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "lastLoginAt" = NOW();
  RETURN NEW;
END;
$$;`;

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const SUPABASE_URL = 'https://yghndmkuogaepegibxhd.supabase.co';
const ANON_KEY = 'sb_publishable_ZoRd0hZE6xkHDkRVDqzgWA_RSrHTeVH';
const DB_URL = 'postgresql://postgres.yghndmkuogaepegibxhd:%40B3n.Jakusa@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
const BASE = 'http://localhost:3000';

const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function uuid() { return crypto.randomUUID(); }

async function createUser(email: string, password: string, fullName: string, phone: string, role: string) {
  console.log(`Creating ${role}: ${email}`);
  const id = uuid();
  const hashed = await bcrypt.hash(password, 10);

  // Insert into auth.users
  await pool.query(`
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
    VALUES ($1, $2, $3, now(), now(),
      '{"provider": "email", "providers": ["email"]}',
      $4::jsonb,
      now(), now(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  `, [id, email, hashed, JSON.stringify({ full_name: fullName, phone, role })]);
  console.log(`  Auth user: ${id}`);

  // Insert into public.User with explicit cast to enum
  await pool.query(`
    INSERT INTO public."User" (id, email, phone, "fullName", role, "lastLoginAt")
    VALUES ($1, $2, $3, $4, $5::public."UserRole", now())
    ON CONFLICT (id) DO UPDATE SET "lastLoginAt" = now()
  `, [id, email.toLowerCase().trim(), phone.replace(/[^0-9]/g, ''), fullName.trim(), role]);
  console.log('  User record created');

  if (role === 'TRAINER') {
    await pool.query(`
      INSERT INTO public."Trainer" ("userId", "updatedAt")
      VALUES ($1, now())
      ON CONFLICT ("userId") DO NOTHING
    `, [id]);
    console.log('  Trainer profile created');
  }

  return id;
}
