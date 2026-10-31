import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!url || !secret || !name || !email || !password) throw new Error('Set Supabase URL, server secret, and ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in your private environment.');
if (name.length < 2 || password.length < 12 || password.length > 128 || !/^\\S+@\\S+\\.\\S+$/.test(email)) throw new Error('Invalid admin details. Password must be 12–128 characters.');

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: masters, error: masterLookupError } = await db.from('users').select('id').eq('role', 'SUPER_ADMIN');
if (masterLookupError) throw masterLookupError;
if ((masters ?? []).length > 1) throw new Error('Multiple Master Admin accounts already exist. Resolve this before bootstrapping.');
const { data: emailOwner, error: emailLookupError } = await db.from('users').select('id,role').eq('email', email).maybeSingle();
if (emailLookupError) throw emailLookupError;
if (emailOwner && emailOwner.role !== 'SUPER_ADMIN') throw new Error('The configured Master Admin email is already assigned to a non-master account.');

const password_hash = await bcrypt.hash(password, 12);
let result;
if ((masters ?? []).length === 1) {
  const { data, error } = await db.from('users').update({ name, email, password_hash, is_active: true, updated_at: new Date().toISOString() })
    .eq('id', masters[0].id).select('id,email,role').single();
  if (error) throw error;
  result = data;
} else {
  const { data, error } = await db.from('users').insert({ name, email, password_hash, role: 'SUPER_ADMIN', is_active: true })
    .select('id,email,role').single();
  if (error) throw error;
  result = data;
}
console.log('Single Master Admin account ready:', result.email);
