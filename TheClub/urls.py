from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from .clubAPI.views import *
from rest_framework_simplejwt import views as jwt_views

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'clubs', ClubViewSet)
router.register(r'self', UserClubViewSet, base_name='User')
router.register(r'members', MemberViewSet, base_name='Member')

urlpatterns = [
    path('', include(router.urls)),
    path('admin', admin.site.urls),
    path('api/token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
    path('metrics/', MemberMetrics.as_view()),
]
