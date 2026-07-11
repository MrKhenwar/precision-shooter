from django.urls import path

from .views import ChooseAIView, MySubscriptionView

app_name = 'billing'

urlpatterns = [
    path('subscription/', MySubscriptionView.as_view(), name='subscription'),
    path('subscription/choose-ai/', ChooseAIView.as_view(), name='choose-ai'),
]
