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
            "waveform_data",
            "created_at",
        )
        read_only_fields = ("duration_seconds", "plays", "created_at", "owner", "likes_count", "liked_by_me", "waveform_data")


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

        try:
            from mutagen import File as MutagenFile
            mf = MutagenFile(song.audio.path)
            if mf and mf.info and getattr(mf.info, "length", None):
                song.duration_seconds = int(mf.info.length)
                song.save(update_fields=["duration_seconds"])
        except Exception:
            pass

        try:
            waveform = self.generate_waveform(song.audio.path)
            if waveform:
                song.waveform_data = waveform
                song.save(update_fields=["waveform_data"])
        except Exception:
            pass

        return song

    def generate_waveform(self, audio_path, num_bars=65):
        try:
            import numpy as np
            from pydub import AudioSegment

            audio = AudioSegment.from_file(audio_path)

            samples = np.array(audio.get_array_of_samples())

            if audio.channels == 2:
                samples = samples.reshape((-1, 2))
                samples = samples.mean(axis=1)

            chunk_size = len(samples) // num_bars
            waveform_data = []

            for i in range(num_bars):
                start = i * chunk_size
                end = start + chunk_size
                chunk = samples[start:end] if start < len(samples) else samples[-chunk_size:]

                rms = np.sqrt(np.mean(chunk**2)) if len(chunk) > 0 else 0
                waveform_data.append(float(rms))

            if max(waveform_data) > 0:
                max_val = max(waveform_data)
                waveform_data = [min(0.3 + (val / max_val) * 0.7, 1.0) for val in waveform_data]
            else:
                waveform_data = [0.5] * num_bars

            return waveform_data

        except ImportError:
            return [0.5 + np.random.random() * 0.5 for _ in range(num_bars)]
        except Exception:
            return None
