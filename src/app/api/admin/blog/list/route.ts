import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return NextResponse.json([], { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("slug, title, description, date, author, tags, published")
    .order("date", { ascending: false });

  return NextResponse.json(data ?? []);
}
