export default async (req) => {
  console.log("FUNCTION HIT");

  try {
    // Read body as text (because it's a ReadableStream)
    const rawBody = await req.text();
    console.log("RAW BODY TEXT:", rawBody);

    const { sellerEmail, messageText, postTitle } = JSON.parse(rawBody || "{}");

    console.log("Parsed sellerEmail:", sellerEmail);
    console.log("Parsed postTitle:", postTitle);
    console.log("Parsed messageText:", messageText);

    const apiKey = process.env.RESEND_API_KEY;
    console.log("API KEY PRESENT:", !!apiKey);

    const payload = {
      from: "Rhondda Noticeboard <noreply@rnb.wales>",
      to: sellerEmail,
      subject: `New message about: ${postTitle}`,
      html: `
        <p>You have a new message on Rhondda Noticeboard:</p>
        <p><strong>${messageText}</strong></p>
        <p>Open your inbox to reply.</p>
      `
    };

    console.log("PAYLOAD:", payload);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    console.log("RESEND RAW RESPONSE:", rawText);

    return new Response(
      JSON.stringify({ success: true, raw: rawText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("FUNCTION ERROR:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
