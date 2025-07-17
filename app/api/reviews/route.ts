import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"

// ---------
// Validation schema
// ---------
const ReviewSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string().min(1).max(50),
  device_name: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  device_id: z.string().optional().nullable(),
  comment: z.string().max(500).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const data = ReviewSchema.parse(json)

    // Insert review using admin client
    const { data: result, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        user_id: data.user_id,
        username: data.username,
        device_name: data.device_name,
        device_id: data.device_id,
        rating: data.rating,
        comment: data.comment,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: error.code,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error("API error:", err)
    const message = err instanceof Error ? err.message : "Unknown server error while saving review."
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceName = searchParams.get("device_name")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabaseAdmin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (deviceName) {
      query = query.eq("device_name", deviceName)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error while fetching reviews."
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
