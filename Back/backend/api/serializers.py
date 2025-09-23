from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Song
import os

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Email already in user.")]
    )

    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "role")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value
    
    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError("Passowrds must match.")
        return attrs
        

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role")


class PublicUserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "role", "profile_picture", "follower_count", "is_following")

    def get_profile_picture(self, obj):
        # return absolute URL or None
        request = self.context.get("request")
        if obj.profile_picture and hasattr(obj.profile_picture, "url"):
            url = obj.profile_picture.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.followers.filter(pk=request.user.pk).exists()


class OwnerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "role")

class SongSerializer(serializers.ModelSerializer):
    owner = OwnerMiniSerializer(read_only=True)

    likes_count = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = (
            "id", "owner", "title", "description",
            "audio", "cover", "is_public",
            "duration_seconds", "plays",
            "likes_count", "liked_by_me",
            "created_at",
        )
        read_only_fields = ("duration_seconds", "plays", "created_at", "owner", "likes_count", "liked_by_me")


    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_liked_by_me(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(pk=request.user.pk).exists()

    def validate_audio(self, f):
        # very light checks (keep simple)
        max_mb = 50  # adjust if you want
        if f.size > max_mb * 1024 * 1024:
            raise serializers.ValidationError(f"Audio exceeds {max_mb} MB.")
        ext = os.path.splitext(f.name)[1].lower()
        if ext not in {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"}:
            raise serializers.ValidationError("Unsupported audio format.")
        return f

    def create(self, validated_data):
        request = self.context["request"]
        song = Song.objects.create(owner=request.user, **validated_data)

        # (Optional) Try to detect duration if mutagen is installed
        try:
            from mutagen import File as MutagenFile
            mf = MutagenFile(song.audio.path)
            if mf and mf.info and getattr(mf.info, "length", None):
                song.duration_seconds = int(mf.info.length)
                song.save(update_fields=["duration_seconds"])
        except Exception:
            pass  # keep it optional/silent

        return song
