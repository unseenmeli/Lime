from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import User

@receiver(m2m_changed, sender=User.following.through)
def update_follower_counts(sender, instance, action, pk_set, **kwargs):
    # instance = the follower doing the change; pk_set = ids of followed users
    if action in {"post_add", "post_remove", "post_clear"}:
        if action == "post_clear":
            return
        for target_id in pk_set:
            try:
                u = User.objects.get(pk=target_id)
                u.follower_count = u.followers.count()
                u.save(update_fields=["follower_count"])
            except User.DoesNotExist:
                pass
