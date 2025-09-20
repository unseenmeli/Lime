from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.html import format_html
from .models import User, Song

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    # Columns in the list page
    list_display = ("username", "role", "follower_count", "avatar_thumb", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active", "is_superuser")
    search_fields = ("username", "email")
    ordering = ("username",)

    # Make follower_count read-only (maintained by signals)
    readonly_fields = ("follower_count",)

    # Show profile picture + following in the form
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Profile", {"fields": ("role", "profile_picture", "follower_count")}),
        ("Social", {"fields": ("following",)}),
    )

    # Add profile fields to the "Add user" form as well
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Profile", {"classes": ("wide",), "fields": ("role", "profile_picture")}),
    )

    # Better UI for many-to-many following
    filter_horizontal = ("following",)

    # Thumbnail preview in list page
    def avatar_thumb(self, obj):
        if obj.profile_picture:
            return format_html('<img src="{}" style="height:32px;width:32px;border-radius:50%;object-fit:cover;" />', obj.profile_picture.url)
        return "—"
    avatar_thumb.short_description = "Avatar"

    # Admin action to recompute follower_count for selected users
    actions = ["recalculate_follower_counts"]

    def recalculate_follower_counts(self, request, queryset):
        count = 0
        for user in queryset:
            # `followers` is the reverse accessor of `following`
            fc = user.followers.count()
            if user.follower_count != fc:
                user.follower_count = fc
                user.save(update_fields=["follower_count"])
                count += 1
        self.message_user(request, f"Recalculated follower_count for {count} user(s).")
    recalculate_follower_counts.short_description = "Recalculate follower counts for selected users"

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "is_public", "plays", "created_at")
    search_fields = ("title", "owner__username")
    list_filter = ("is_public", "created_at")