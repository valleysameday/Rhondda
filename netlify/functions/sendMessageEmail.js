import { Resend } from "resend";

export default async (req, res) => {
  try {
    const { sellerEmail, messageText, postTitle } = JSON.parse(req.body);

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Rhondda Noticeboard <noreply@rnb.wales>",
      to: sellerEmail,
      subject: `New message about: ${postTitle}`,
      html: `
        <p>You have a new message on Rhondda Noticeboard:</p>
        <p><strong>${messageText}</strong></p>
        <p>Open your inbox to reply.</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
