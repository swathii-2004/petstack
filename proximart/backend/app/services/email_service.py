from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    if not settings.SENDGRID_API_KEY or not settings.SENDGRID_FROM_EMAIL:
        logger.warning(f"SendGrid not configured. Skipping email to {to_email} with subject '{subject}'.")
        return
        
    message = Mail(
        from_email=settings.SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email sent to {to_email}. Status code: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

def send_approval_email(to_email: str, name: str):
    subject = "Your ProxiMart Vendor Application has been Approved!"
    html_content = f"""
    <h2>Welcome to ProxiMart, {name}!</h2>
    <p>Your vendor application has been reviewed and approved.</p>
    <p>You can now log into your vendor dashboard and start listing your products.</p>
    <br>
    <p>Best regards,</p>
    <p>The ProxiMart Team</p>
    """
    send_email(to_email, subject, html_content)

def send_rejection_email(to_email: str, name: str, reason: str):
    subject = "Update regarding your ProxiMart Vendor Application"
    html_content = f"""
    <h2>Hi {name},</h2>
    <p>We have reviewed your vendor application for ProxiMart.</p>
    <p>Unfortunately, we are unable to approve your application at this time.</p>
    <p><strong>Reason:</strong> {reason}</p>
    <br>
    <p>Best regards,</p>
    <p>The ProxiMart Team</p>
    """
    send_email(to_email, subject, html_content)
