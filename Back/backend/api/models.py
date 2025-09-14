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

    def __str__(self):
        return f"{self.username}"