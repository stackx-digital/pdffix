import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // FIXED: validate next param to prevent open redirect — only allow relative paths
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Only allow simple relative paths — block protocol-relative URLs and encoded tricks
  const next = /^\/[a-zA-Z0-9\-/_?=&%]*$/.test(rawNext) ? rawNext : "/dashboard";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=link_expired`);
    }

    // Create profile if not exists (first time login after email confirmation)
    if (data.user) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name ?? null,
          plan: "free",
        });
      }
    }
  }

  // Password recovery — redirect to reset password page
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
