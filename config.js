// Supabase 프로젝트의 공개 연결 정보입니다. 비밀 키는 사용하지 않습니다.
const SUPABASE_URL = "https://frekludmgfeioigjhwsx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-ShtsyjfUH5v5ebuOqh1hg_QjIQx7Hk";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
