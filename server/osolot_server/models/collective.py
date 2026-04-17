from django.db import models

from .user import User


# 'Group' is taken by Django defaults :/
class Collective(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(max_length=10_000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    members = models.ManyToManyField(
        User,
        through="Membership",
        through_fields=("collective", "user"),
        related_name="collectives",
    )

    class Visibility(models.TextChoices):
        PUBLIC = "public"
        PRIVATE = "private"
    visibility = models.CharField(
        choices=Visibility.choices, default=Visibility.PUBLIC
    )

    class AdmissionType(models.TextChoices):
        OPEN = "open"
        APPLICATION = "application"
        # CLOSED = "closed"
        # INVITE_ONLY = "invite-only"
    admission_type = models.CharField(
        choices=AdmissionType.choices, default=AdmissionType.OPEN
    )

    application_question = models.TextField(
        blank=True, help_text="Message to users who apply for membership."
    )

    def __str__(self) -> str:
        return self.name
