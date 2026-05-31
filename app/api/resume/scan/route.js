import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { scanResumePdf } from "@/actions/resume";

export const runtime = "nodejs";

export async function POST(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content type must be multipart/form-data" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const pdfFile = formData.get("pdf");

  if (!pdfFile || !(pdfFile instanceof File)) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  if (pdfFile.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  const arrayBuffer = await pdfFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdfParse(buffer);

  const text = (data.text || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Unable to extract text from PDF" },
      { status: 400 }
    );
  }

  try {
    const result = await scanResumePdf(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Resume scan error:", error);
    return NextResponse.json(
      { error: error.message || "Resume scan failed" },
      { status: 500 }
    );
  }
}
