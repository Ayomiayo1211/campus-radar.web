import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!url || !secret || !name || !email || !password) throw new Error('Set Supabase URL, server secret, and ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in your private environment.');
if (name.length < 2 || password.length < 12 || password.length > 128 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Invalid admin details. Password must be 12–128 characters.');
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const password_hash = await bcrypt.hash(password, 12);
const { data, error } = await db.from('users').upsert({ name, email, password_hash, role: 'SUPER_ADMIN', is_active: true }, { onConflict: 'email' }).select('id,email,role').single();
if (error) throw error;
console.log('Initial newsroom administrator ready:', data.email);
