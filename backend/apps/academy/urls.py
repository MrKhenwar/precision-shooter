from django.urls import path

from .views import (
    ExpiringCylindersView,
    FeeDetailView,
    FeeListCreateView,
    InventoryDetailView,
    InventoryListCreateView,
    MyFeesView,
    PayFeeView,
)

app_name = 'academy'

urlpatterns = [
    # Fees (coach)
    path('fees/', FeeListCreateView.as_view(), name='fees'),
    path('fees/<int:pk>/', FeeDetailView.as_view(), name='fee-detail'),
    # Fees (athlete)
    path('my-fees/', MyFeesView.as_view(), name='my-fees'),
    path('my-fees/<int:pk>/pay/', PayFeeView.as_view(), name='pay-fee'),
    # Inventory (coach)
    path('inventory/', InventoryListCreateView.as_view(), name='inventory'),
    path('inventory/<int:pk>/', InventoryDetailView.as_view(), name='inventory-detail'),
    path('inventory/expiring/', ExpiringCylindersView.as_view(), name='expiring-cylinders'),
]
