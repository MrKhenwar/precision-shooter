from django.urls import path

from .views import (
    AthleteDiaryView,
    AthleteEvaluationsView,
    AthleteShootingRecordsView,
    CreateEvaluationView,
    MyDiaryView,
    MyEvaluationsView,
    MyShootingRecordsView,
)

app_name = 'performance'

urlpatterns = [
    # Athlete (own)
    path('shooting-records/', MyShootingRecordsView.as_view(), name='my-shooting'),
    path('diary/', MyDiaryView.as_view(), name='my-diary'),
    path('evaluations/', MyEvaluationsView.as_view(), name='my-evaluations'),
    # Coach
    path('evaluations/create/', CreateEvaluationView.as_view(), name='create-evaluation'),
    path('athletes/<int:athlete_id>/evaluations/', AthleteEvaluationsView.as_view(),
         name='athlete-evaluations'),
    path('athletes/<int:athlete_id>/shooting-records/', AthleteShootingRecordsView.as_view(),
         name='athlete-shooting'),
    path('athletes/<int:athlete_id>/diary/', AthleteDiaryView.as_view(), name='athlete-diary'),
]
