export default async (req) => {
  try {
    const { sellerEmail, messageText, postTitle } = JSON.parse(req.body);

    const apiKey = process.env.RESEND_API_KEY;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Rhondda Noticeboard <noreply@rnb.wales>",
        to: sellerEmail,
        subject: `New message about: ${postTitle}`,
        html: `
          <p>You have a new message on Rhondda Noticeboard:</p>
          <p><strong>${messageText}</strong></p>
          <p>Open your inbox to reply.</p>
        `
      })
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
