from django.urls import path

from .views import (
    AthleteAttendanceView,
    AttendanceRecordsView,
    AttendanceSummaryView,
    BatchAttendanceView,
    BatchDetailView,
    BatchListCreateView,
    BatchMembersView,
    ExpertDirectoryView,
    MyCoachProfileView,
    MyExpertProfileView,
    PendingLinkRequestsView,
    RespondLinkRequestView,
    RosterView,
    SetAthleteTierView,
)

app_name = 'coaching'

urlpatterns = [
    path('profile/', MyCoachProfileView.as_view(), name='profile'),
    path('link-requests/', PendingLinkRequestsView.as_view(), name='pending-links'),
    path('link-requests/<int:pk>/<str:action>/', RespondLinkRequestView.as_view(),
         name='respond-link'),
    path('roster/', RosterView.as_view(), name='roster'),
    path('athletes/<int:athlete_id>/tier/', SetAthleteTierView.as_view(), name='set-tier'),
    # Batches
    path('batches/', BatchListCreateView.as_view(), name='batches'),
    path('batches/<int:pk>/', BatchDetailView.as_view(), name='batch-detail'),
    path('batches/<int:batch_id>/members/', BatchMembersView.as_view(), name='batch-members'),
    path('batches/<int:batch_id>/members/<int:athlete_id>/', BatchMembersView.as_view(),
         name='batch-member-remove'),
    # Attendance
    path('batches/<int:batch_id>/attendance/', BatchAttendanceView.as_view(),
         name='batch-attendance'),
    path('attendance/summary/', AttendanceSummaryView.as_view(), name='attendance-summary'),
    path('attendance/records/', AttendanceRecordsView.as_view(), name='attendance-records'),
    path('attendance/athlete/<int:athlete_id>/', AthleteAttendanceView.as_view(),
         name='athlete-attendance'),
    # Expert persona
    path('expert/profile/', MyExpertProfileView.as_view(), name='expert-profile'),
    path('experts/', ExpertDirectoryView.as_view(), name='expert-directory'),
]
