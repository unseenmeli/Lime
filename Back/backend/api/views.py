from rest_framework import permissions, status, viewsets, mixins, decorators, response
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, PublicUserSerializer, SongSerializer
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.shortcuts import get_object_or_404
from .models import Song
from .permissions import IsOwnerOrReadOnly
from django.db.models import Q
from django.http import Http404
from django.conf import settings
import os
from .utils import serve_audio_with_range

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        },
        status=status.HTTP_201_CREATED,
        )
    

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token_str = request.data.get("refresh")
        if not token_str:
            return Response({"detail": "Refresh token required."}, status=400)
        try:
            RefreshToken(token_str).blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=400)
        return Response(status=205)
    

class UserSearchView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        if not q or len(q) < 2:
            return User.objects.none()
        return User.objects.filter(username__icontains=q).order_by("username")[:20]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    

class FollowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        # follow user
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({"detail": "You cannot follow yourself."}, status=400)
        request.user.following.add(target)
        # follower_count is updated via signal
        return Response(
            {
                "username": target.username,
                "is_following": True,
                "follower_count": target.followers.count(),
            },
            status=200,
        )

    def delete(self, request, username):
        # unfollow user
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({"detail": "You cannot unfollow yourself."}, status=400)
        request.user.following.remove(target)
        return Response(
            {
                "username": target.username,
                "is_following": False,
                "follower_count": target.followers.count(),
            },
            status=200,
        )
    

class UserDetailView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    lookup_field = "username"
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    

class SongViewSet(viewsets.ModelViewSet):
    """
    /api/songs/           (GET list, POST create)
    /api/songs/{id}/      (GET retrieve, PUT/PATCH owner-only, DELETE owner-only)

    Public: list returns public songs + your own private ones if logged-in.
    """
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Song.objects.filter(Q(is_public=True) | Q(owner=user))
        return Song.objects.filter(is_public=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        serializer.save()  # owner set in serializer.create()

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        song = self.get_object()
        if song.owner_id == request.user.id:
            return Response({"detail": "You cannot like your own song."}, status=status.HTTP_400_BAD_REQUEST)
        song.likes.add(request.user)
        data = {
            "likes_count": song.likes.count(),
            "liked_by_me": True,
        }
        return Response(data, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        song = self.get_object()
        song.likes.remove(request.user)
        data = {
            "likes_count": song.likes.count(),
            "liked_by_me": False,
        }
        return Response(data, status=status.HTTP_200_OK)


def serve_audio(request, owner_id, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, 'audio', str(owner_id), filename)

    if not os.path.exists(file_path):
        raise Http404("Audio file not found")

    return serve_audio_with_range(request, file_path)
