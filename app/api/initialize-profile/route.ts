import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Log the raw request body
    const rawBody = await request.json();
    console.log('Raw request body:', rawBody);

    const { user_id, ...profileData } = rawBody;
    console.log('Extracted user_id:', user_id);
    console.log('Profile data:', profileData);

    if (!user_id) {
      console.log('user_id is missing or undefined');
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Log the data being inserted
    console.log('Attempting to insert:', { user_id, ...profileData });

    const { data, error } = await supabase
      .from("municipios")
      .insert([{ user_id, ...profileData }])
      .select();  // Add .select() to see what was inserted

    if (error) {
      console.log('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Profile initialized successfully.", data },
      { status: 201 }
    );
  } catch (error: any) {
    console.log('Caught error:', error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
} 