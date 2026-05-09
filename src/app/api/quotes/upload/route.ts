import { NextResponse } from "next/server";
import { driveSafeTimestamp, uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";
import { createDefaultBazQuote, renderQuoteJson, renderQuoteMarkdown } from "@/src/lib/quote-generator";

export async function POST() {
  try {
    const quote = createDefaultBazQuote();
    const stamp = driveSafeTimestamp(quote.createdAt);
    const markdownFileName = `quote_${quote.quoteId}_${stamp}.md`;
    const jsonFileName = `quote_${quote.quoteId}_${stamp}.json`;

    const markdownStatus = await uploadBazOsLogToDrive(markdownFileName, renderQuoteMarkdown(quote));
    const jsonStatus = await uploadBazOsLogToDrive(jsonFileName, renderQuoteJson(quote));

    return NextResponse.json({
      ok: true,
      quoteId: quote.quoteId,
      files: [
        { fileName: markdownFileName, n8nStatus: markdownStatus },
        { fileName: jsonFileName, n8nStatus: jsonStatus },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown quote upload error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
