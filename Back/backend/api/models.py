from django.db import models
from django.contrib.auth.models import AbstractUser

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