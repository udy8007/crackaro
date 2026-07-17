import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, phone, email = "", interest = "", message } = req.body || {};

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Name, phone, and message are required.",
      });
    }

    if (!supabase) {
      return res.status(503).json({
        message:
          "Database is not configured. Add Supabase env vars in server/.env",
      });
    }

    const row = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      interest: interest.trim() || null,
      message: message.trim(),
    };

    const { data, error } = await supabase
      .from("enquiries")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("[enquiries]", error);
      return res.status(500).json({
        message: "Could not save enquiry. Check Supabase table setup.",
      });
    }

    return res.status(201).json({
      message: "Enquiry saved",
      id: data.id,
    });
  } catch (error) {
    console.error("[enquiries]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[enquiries]", error);
      return res.status(500).json({ message: "Could not fetch enquiries." });
    }

    return res.json({ enquiries: data });
  } catch (error) {
    console.error("[enquiries]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
