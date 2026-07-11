from django.urls import path

from .views import (
    ChildDetailView,
    ClubListView,
    MyAthleteProfileView,
    MyAttendanceView,
    MyBatchesView,
    MyChildrenView,
    MyLinkRequestsView,
    ParentLinkRequestView,
    ParentRequestsView,
    RequestCoachLinkView,
    SelfAttendanceView,
)

app_name = 'athletes'

urlpatterns = [
    path('profile/', MyAthleteProfileView.as_view(), name='profile'),
    path('clubs/', ClubListView.as_view(), name='clubs'),
    path('link-request/', RequestCoachLinkView.as_view(), name='link-request'),
    path('link-requests/', MyLinkRequestsView.as_view(), name='my-link-requests'),
    path('attendance/', MyAttendanceView.as_view(), name='my-attendance'),
    path('attendance/self/', SelfAttendanceView.as_view(), name='self-attendance'),
    path('batches/', MyBatchesView.as_view(), name='my-batches'),
    # Athlete approves parent access
    path('parent-requests/', ParentRequestsView.as_view(), name='parent-requests'),
    path('parent-requests/<int:pk>/<str:action>/', ParentRequestsView.as_view(),
         name='respond-parent'),
    # Parent persona
    path('parent/link-request/', ParentLinkRequestView.as_view(), name='parent-link-request'),
    path('parent/children/', MyChildrenView.as_view(), name='parent-children'),
    path('parent/children/<int:athlete_id>/', ChildDetailView.as_view(), name='child-detail'),
]
