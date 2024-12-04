import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 flex flex-col gap-12 px-4 py-10 max-w-5xl mx-auto">
      <Link
        href={`/protected/dashboard?user_id=${user.id}`}
        className="flex justify-center"
      >
        <Button
          size="lg"
          variant={"default"}
          className="opacity-100 dark:opacity-100 cursor-none pointer-events-none items-center"
        >
          Ir para Dashboard
        </Button>
      </Link>
      
      <div>
        <h2 className="font-bold text-2xl mb-4 text-center">Insira os dados do orçamento</h2>
        <FetchDataSteps user_id={user.id} />

      </div>
    </div>
  );
}
