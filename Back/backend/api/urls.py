from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, LogoutView, UserSearchView, FollowView, UserDetailView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="token_blacklist"),
    path("me/", MeView.as_view(), name="me"),
    path("users/search/", UserSearchView.as_view(), name="user_search"),
    path("users/<str:username>/follow/", FollowView.as_view(), name="user_follow"),
    path("users/<str:username>/", UserDetailView.as_view(), name="user_detail"),

]