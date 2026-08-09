"use client";

import { useRef, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CoverLetterPreview = ({ content, companyName }) => {
  const previewRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const downloadCoverLetter = async () => {
    if (!previewRef.current || !content) return;

    setDownloading(true);
    try {
      const safeCompanyName = (companyName || "Company").replace(/[^a-z0-9]+/gi, "_");
      await html2pdf()
        .set({
          margin: 0.7,
          filename: `Cover_Letter_${safeCompanyName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(previewRef.current)
        .save();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={downloadCoverLetter} disabled={downloading || !content}>
          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download
        </Button>
      </div>
      <div ref={previewRef} className="bg-white p-6 text-black">
        <MDEditor value={content} preview="preview" height={700} />
      </div>
    </div>
  );
};

export default CoverLetterPreview;