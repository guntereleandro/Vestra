import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_TEST_URL;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && secret);
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.from("portfolio_snapshots").select("*").eq("portfolio_id", "1397a16f-105c-4058-99af-1eca724d67fc").order("snapshot_date");
assert.ifError(error);
console.log(JSON.stringify(data, null, 2));
