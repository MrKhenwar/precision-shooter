from django.urls import path

from .views import (
    CompleteTrainingSessionView,
    CoursePlanDetailView,
    CoursePlanListCreateView,
    MyTrainingSessionsView,
    TrainingSessionListCreateView,
)

app_name = 'training'

urlpatterns = [
    # Coach
    path('course-plans/', CoursePlanListCreateView.as_view(), name='course-plans'),
    path('course-plans/<int:pk>/', CoursePlanDetailView.as_view(), name='course-plan-detail'),
    path('sessions/', TrainingSessionListCreateView.as_view(), name='sessions'),
    # Athlete
    path('my-sessions/', MyTrainingSessionsView.as_view(), name='my-sessions'),
    path('my-sessions/<int:pk>/complete/', CompleteTrainingSessionView.as_view(),
         name='complete-session'),
]
