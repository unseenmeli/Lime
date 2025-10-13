from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator

class User(AbstractUser):
    class Roles(models.TextChoices):
        ARTIST = "ARTIST", "Artist"
        LISTENER = "LISTENER", "Listener"

    role = models.CharField(
        max_length=20,
        choices=Roles.choices
    )
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)
    following = models.ManyToManyField("self", symmetrical=False, related_name="followers", blank=True)
    follower_count = models.PositiveIntegerField(default=0)


    def __str__(self):
        return f"{self.username}"


def audio_upload_to(instance, filename):
    return f"audio/{instance.owner_id}/{filename}"

def cover_upload_to(instance, filename):
    return f"covers/{instance.owner_id}/{filename}"


class Song(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="songs",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    audio = models.FileField(upload_to=audio_upload_to)
    cover = models.ImageField(upload_to=cover_upload_to, blank=True, null=True)
    is_public = models.BooleanField(default=True)

    genre = models.CharField(
        max_length=30,
        blank=True,
        db_index=True,
        validators=[RegexValidator(r"^\S*$", "Genre cannot contain spaces.")],
        help_text="Single tag without spaces, e.g. house or #house",
    )

    duration_seconds = models.PositiveIntegerField(blank=True, null=True)
    plays = models.PositiveIntegerField(default=0)
    likes = models.ManyToManyField(User, blank=True, related_name="liked_songs")
    waveform_data = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} by {self.owner}"
