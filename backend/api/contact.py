import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

CONTACT_RECIPIENT = "anmoldixit091@gmail.com"

class ContactFormRequest(BaseModel):
    name: str
    email: str
    profession: Optional[str] = None
    message: str


def _send_contact_email(req: ContactFormRequest) -> None:
    """
    Sends the contact-form submission to CONTACT_RECIPIENT using the project
    SMTP credentials stored in environment variables:
        SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
    Falls back to a detailed console log if any variable is missing.
    """
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "").replace(" ", "")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user or "noreply@astrosutra.ai")

    profession_line = f"<tr><td style='padding:8px 0;color:#888;font-size:13px;'>Profession</td><td style='padding:8px 0;font-size:13px;'>{req.profession}</td></tr>" if req.profession else ""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Query – AstroSutra AI</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:'Helvetica Neue',Arial,sans-serif;color:#2D2721;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;
              overflow:hidden;box-shadow:0 8px 30px rgba(110,101,88,0.12);
              border:1px solid #E9DFC8;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#F5E6C8,#FAF8F3);
                padding:36px 32px;border-bottom:1px solid #E9DFC8;text-align:center;">
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#7B5E3A;letter-spacing:0.5px;">
        🪐 AstroSutra AI
      </h1>
      <p style="margin:8px 0 0;font-size:13px;color:#9E8E72;letter-spacing:1px;text-transform:uppercase;">
        New Contact Form Submission
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:15px;color:#555;margin-top:0;">
        You have received a new query through the AstroSutra AI contact page.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;
                    background:#FAF8F3;border-radius:12px;overflow:hidden;
                    border:1px solid #E9DFC8;">
        <tbody>
          <tr style="background:#F5E6C8;">
            <td colspan="2" style="padding:12px 16px;font-size:12px;font-weight:700;
                                   color:#7B5E3A;text-transform:uppercase;letter-spacing:0.8px;">
              Sender Details
            </td>
          </tr>
          <tr>
            <td style="padding:10px 16px;color:#888;font-size:13px;width:110px;">Name</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;">{req.name}</td>
          </tr>
          <tr style="background:#FFF8EE;">
            <td style="padding:10px 16px;color:#888;font-size:13px;">Email</td>
            <td style="padding:10px 16px;font-size:13px;">
              <a href="mailto:{req.email}" style="color:#7B5E3A;text-decoration:none;font-weight:600;">
                {req.email}
              </a>
            </td>
          </tr>
          {profession_line}
        </tbody>
      </table>

      <!-- Message box -->
      <div style="background:#FAF8F3;border-left:4px solid #C4A882;
                  border-radius:8px;padding:16px 20px;margin-top:24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;
                  text-transform:uppercase;color:#9E8E72;letter-spacing:0.8px;">
          Message
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap;">{req.message}</p>
      </div>

      <!-- Reply CTA -->
      <div style="text-align:center;margin-top:32px;">
        <a href="mailto:{req.email}?subject=Re: Your query to AstroSutra AI"
           style="display:inline-block;background:#7B5E3A;color:#fff;
                  text-decoration:none;padding:12px 28px;border-radius:8px;
                  font-size:13px;font-weight:600;letter-spacing:0.5px;">
          ✉️ Reply to {req.name}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #E9DFC8;
                text-align:center;background:#FAF8F3;">
      <p style="margin:0;font-size:11px;color:#B0A090;">
        AstroSutra AI · Powered by <strong>manasai.tech</strong> · ISS Delhi
      </p>
    </div>
  </div>
</body>
</html>
"""

    if smtp_host and smtp_port and smtp_user and smtp_pass:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"📬 New Contact Query from {req.name} – AstroSutra AI"
        msg["From"]    = f"AstroSutra AI <{smtp_from}>"
        msg["To"]      = CONTACT_RECIPIENT
        msg["Reply-To"] = req.email
        msg.attach(MIMEText(html_body, "html"))

        try:
            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port)
            else:
                server = smtplib.SMTP(smtp_host, port)
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [CONTACT_RECIPIENT], msg.as_string())
            server.quit()
            print(f"[Contact] ✅ Email sent to {CONTACT_RECIPIENT} from {req.email}")
        except Exception as e:
            print(f"[Contact] ❌ SMTP send failed: {e}")
            raise
    else:
        # Graceful fallback – print to console so no submission is silently lost
        print("=" * 60)
        print("[CONTACT FORM — NO SMTP ENV — printing to console]")
        print(f"  Name       : {req.name}")
        print(f"  Email      : {req.email}")
        print(f"  Profession : {req.profession}")
        print(f"  Message    :\n{req.message}")
        print("=" * 60)


@router.post("/contact")
def submit_contact_form(req: ContactFormRequest):
    print(f"[Contact] Form received from {req.name} <{req.email}>")
    try:
        _send_contact_email(req)
    except Exception:
        # Don't block the user — we already logged the error above
        pass

    return {
        "status": "success",
        "message": "🙏 Namaste! Thank you for reaching out. We have received your query and will get back to you shortly.",
    }
