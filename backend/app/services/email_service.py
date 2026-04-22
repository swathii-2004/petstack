import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.config import settings

logger = logging.getLogger(__name__)


def send_approval_email(to_email: str, name: str) -> None:
    """Send an approval email via SendGrid."""
    if not settings.SENDGRID_API_KEY:
        logger.warning(f"SENDGRID_API_KEY is not set. Skipping approval email to {to_email}.")
        return

    subject = "PetStack — Your account has been approved"
    body = f"Congratulations {name}, your account has been approved. You can now log in."

    message = Mail(
        from_email=settings.SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        plain_text_content=body,
    )

    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Approval email sent to {to_email} (Status Code: {response.status_code})")
    except Exception as e:
        logger.error(f"Failed to send approval email to {to_email}: {e}")


def send_rejection_email(to_email: str, name: str, reason: str) -> None:
    """Send a rejection email via SendGrid."""
    if not settings.SENDGRID_API_KEY:
        logger.warning(f"SENDGRID_API_KEY is not set. Skipping rejection email to {to_email}.")
        return

    subject = "PetStack — Account registration update"
    body = f"Hi {name}, your registration was not approved. Reason: {reason}. You may resubmit with updated documents."

    message = Mail(
        from_email=settings.SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        plain_text_content=body,
    )

    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Rejection email sent to {to_email} (Status Code: {response.status_code})")
    except Exception as e:
        logger.error(f"Failed to send rejection email to {to_email}: {e}")
