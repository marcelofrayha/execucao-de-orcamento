import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/protected";
  
  // Use the environment variable for the base URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (code) {
    const supabase = await createClient();
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth error:", error);
        return NextResponse.redirect(
          `${baseUrl}/sign-in?error=${encodeURIComponent(error.message)}`
        );
      }

      // Recuperar User ID após troca de código por sessão
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.redirect(
          `${baseUrl}/sign-in?error=${encodeURIComponent('Autenticação falhou.')}`
        );
      }

      // Redirecionar para a página de inicialização do perfil
      return NextResponse.redirect(`${baseUrl}/initialize-profile?user_id=${user.id}`);
    } catch (error: any) {
      console.error("Session exchange error:", error);
      return NextResponse.redirect(
        `${baseUrl}/sign-in?error=${encodeURIComponent(error.message || 'Failed to exchange session')}`
      );
    }
  }

  // URL para redirecionar após o processo de confirmação de signup
  return NextResponse.redirect(`${baseUrl}${next}`);
}
