import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_subscription_email(user_email: str, user_name: str, tier: str, amount: float, order_id: str, payment_id: str):
    """
    Sends a premium HTML order confirmation email to the user.
    Falls back to rich console logs if SMTP settings are missing from .env.
    """
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    if smtp_pass:
        smtp_pass = smtp_pass.replace(" ", "")
    smtp_from = os.environ.get("SMTP_FROM", "billing@jyotishasutra.ai")

    subject = f"🌌 JyotishaSutra AI — Welcome to the {tier.upper()} Tier!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #FAF8F5;
                color: #2D2721;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #FFFFFF;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 8px 30px rgba(110, 101, 88, 0.1);
                border: 1px solid #E9DFC8;
            }}
            .header {{
                background: linear-gradient(135deg, #F5E6C8, #FAF8F3);
                padding: 40px 20px;
                text-align: center;
                border-bottom: 1px solid #E9DFC8;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                color: #C89B3C;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
            }}
            .content h2 {{
                margin-top: 0;
                font-size: 20px;
                color: #6E6558;
            }}
            .invoice-table {{
                width: 100%;
                border-collapse: collapse;
                margin: 24px 0;
            }}
            .invoice-table td {{
                padding: 12px 0;
                border-bottom: 1px solid #FAF8F5;
                font-size: 14px;
            }}
            .invoice-table td.label {{
                color: #6E6558;
                font-weight: 600;
            }}
            .invoice-table td.value {{
                text-align: right;
                font-weight: 700;
                color: #2D2721;
            }}
            .total-row td {{
                border-top: 2px solid #E9DFC8;
                font-size: 16px !important;
                padding-top: 18px !important;
            }}
            .footer {{
                background-color: #FAF8F5;
                padding: 24px 30px;
                text-align: center;
                font-size: 12px;
                color: #6E6558;
                border-top: 1px solid #E9DFC8;
            }}
            .btn {{
                display: inline-block;
                background: linear-gradient(135deg, #C89B3C, #A77C2B);
                color: #FFFFFF !important;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 14px;
                font-weight: 700;
                margin-top: 20px;
                box-shadow: 0 4px 15px rgba(200, 155, 60, 0.25);
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://jyotishasutraai.onrender.com/logo.png" alt="JyotishaSutra AI Logo" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 12px; object-fit: contain;">
                <h1>JYOTISHASUTRA AI</h1>
                <p style="margin: 8px 0 0 0; color: #6E6558; font-weight: 500;"> Cosmic Upgrade Successful</p>
            </div>
            <div class="content">
                <h2>Namaste {user_name},</h2>
                <p>Your spiritual journey has ascended. Your subscription to the <strong>JyotishaSutra AI {tier.capitalize()} Plan</strong> is now active, unlocking premium Vedic chart features, Vimshottari timelines, and RAG-Gita guided AI chats.</p>
                
                <table class="invoice-table">
                    <tr>
                        <td class="label">Tier Upgraded</td>
                        <td class="value">{tier.capitalize()}</td>
                    </tr>
                    <tr>
                        <td class="label">Order ID</td>
                        <td class="value">{order_id}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment ID</td>
                        <td class="value">{payment_id}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="label" style="font-size: 16px; color: #C89B3C;">Amount Charged</td>
                        <td class="value" style="font-size: 16px; color: #C89B3C;">INR {amount:.2f}</td>
                    </tr>
                </table>

                <p>Please refresh your dashboard to access standard/pro features instantly. If you have any questions or require custom rectifications, do not hesitate to contact our team.</p>
                
                <div style="text-align: center;">
                    <a href="https://jyotishasutraai.onrender.com" class="btn">Go to Dashboard</a>
                </div>
            </div>
            <div class="footer">
                🔒 Secured transaction · Powered by Razorpay · Thank you for trusting JyotishaSutra AI
            </div>
        </div>
    </body>
    </html>
    """

    if smtp_host and smtp_port and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = user_email
            
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            # Use SSL/TLS based on port
            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port)
            else:
                server = smtplib.SMTP(smtp_host, port)
                server.starttls()
                
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [user_email], msg.as_string())
            server.quit()
            print(f"[Email Service] Transactional receipt email successfully sent to {user_email}.")
        except Exception as smtp_err:
            print(f"[Email Service] SMTP connection failed to send mail: {smtp_err}")
    else:
        print("\n" + "="*80)
        print(f"[EMAIL MOCK - NO SMTP ENVIRONMENT FOUND]")
        print(f"TO: {user_email}")
        print(f"SUBJECT: {subject}")
        print(f"BODY:\n{html_content}")
        print("="*80 + "\n")


def _send_single_email(to_email: str, subject: str, html_content: str):
    """Internal helper to dispatch an email via SMTP or log mock output."""
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    if smtp_pass:
        smtp_pass = smtp_pass.replace(" ", "")
    smtp_from = os.environ.get("SMTP_FROM", "appointments@jyotishasutra.ai")

    if smtp_host and smtp_port and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html"))
            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port)
            else:
                server = smtplib.SMTP(smtp_host, port)
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
            server.quit()
            print(f"[Email Service] Email successfully sent to {to_email}.")
        except Exception as err:
            print(f"[Email Service] Failed to send email to {to_email}: {err}")
    else:
        print("\n" + "="*80)
        print(f"[EMAIL MOCK - NO SMTP SETTINGS]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"BODY:\n{html_content}")
        print("="*80 + "\n")


def send_consultation_emails(
    customer_name: str,
    customer_phone: str,
    customer_email: str,
    plan_tier: str,
    amount: float,
    booking_id: str,
    payment_id: str,
    order_id: str,
    topic: str,
    preferred_date: str,
    time_slot: str,
    question: str
):
    """
    Dispatches 2 emails upon successful Razorpay payment for Expert Consultation:
    1. Receipt & confirmation email to Customer.
    2. Booking alert to Guruji & Support (anmoldixit091@gmail.com).
    """
    admin_email = "anmoldixit091@gmail.com"
    plan_title = "Single Focused Query (10-15 Mins)" if plan_tier == 'single' else "Comprehensive Life Guidance (40-60 Mins)"

    # 1. Customer Email HTML
    customer_html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #FAF8F3; padding: 20px; color: #2D2721;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFDF9; border: 2px solid #E9DFC8; border-radius: 20px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #7C4D32, #897365); color: #FFF; padding: 25px; text-align: center;">
                <img src="https://jyotishasutraai.onrender.com/logo.png" alt="JyotishaSutra AI Logo" style="width: 48px; height: 48px; border-radius: 10px; margin-bottom: 10px; object-fit: contain;">
                <h1 style="margin: 0; font-size: 24px;">JyotishaSutra AI</h1>
                <p style="margin: 5px 0 0 0; color: #F5E6C8; font-weight: bold;">Appointment Request Confirmed</p>
            </div>
            <div style="padding: 25px; line-height: 1.6;">
                <h2 style="color: #7C4D32;">Namaste {customer_name},</h2>
                <p>Thank you for booking a 1-on-1 expert consultation with <strong>Mr. Sanoj Kumar (Guruji)</strong>, DRDO Scientist & Vedic Astrology Master.</p>
                <div style="background: #FDF9F0; border: 1px solid #E9DFC8; border-radius: 12px; padding: 15px; margin: 20px 0;">
                    <p>📋 <strong>Booking Ref:</strong> <span style="font-family: monospace; font-size: 16px; color: #897365;">{booking_id}</span></p>
                    <p>💳 <strong>Payment ID:</strong> {payment_id}</p>
                    <p>✨ <strong>Consultation Plan:</strong> INR {amount:.2f} ({plan_title})</p>
                    <p>🎯 <strong>Topic:</strong> {topic}</p>
                    <p>📅 <strong>Requested Date/Slot:</strong> {preferred_date} ({time_slot})</p>
                </div>
                <p>Our team will contact you on WhatsApp/Phone (<strong>{customer_phone}</strong>) shortly to confirm your exact appointment schedule.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # 2. Guruji / Admin Alert Email HTML
    admin_html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #F4F4F5; padding: 20px; color: #18181B;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 2px solid #D4D4D8; border-radius: 20px; overflow: hidden;">
            <div style="background: #18181B; color: #FFFFFF; padding: 25px; text-align: center;">
                <h2 style="margin: 0;">🙏 NEW EXPERT CONSULTATION BOOKING</h2>
                <p style="margin: 5px 0 0 0; color: #E4E4E7;">Ref ID: {booking_id}</p>
            </div>
            <div style="padding: 25px; line-height: 1.6;">
                <p style="font-size: 16px;"><strong>Guruji & Team,</strong> a new seeker has completed payment for a consultation:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Seeker Name:</strong></td><td>{customer_name}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Phone / WhatsApp:</strong></td><td>{customer_phone}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Email:</strong></td><td>{customer_email}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Plan:</strong></td><td>INR {amount:.2f} ({plan_title})</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Category / Topic:</strong></td><td>{topic}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Date & Time Slot:</strong></td><td>{preferred_date} ({time_slot})</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Payment ID:</strong></td><td>{payment_id}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #E4E4E7;"><strong>Order ID:</strong></td><td>{order_id}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Seeker Notes / Question:</strong></td><td>{question or "N/A"}</td></tr>
                </table>
            </div>
        </div>
    </body>
    </html>
    """

    # Send email to Customer if valid email provided
    if customer_email and "@" in customer_email and not customer_email.endswith("@consultation.jyotishasutra.ai"):
        _send_single_email(customer_email, f"🌌 JyotishaSutra AI — Consultation Confirmed ({booking_id})", customer_html)

    # Send alert email to Guruji & Support (anmoldixit091@gmail.com)
    _send_single_email(admin_email, f"🙏 New Consultation Paid (₹{amount}) — {customer_name} ({booking_id})", admin_html)

