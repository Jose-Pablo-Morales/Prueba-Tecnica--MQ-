from django.urls import path
from .views import (
    CollectionListCreateView,
    CollectionDetailView,
    BankMovementListCreateView,
    BankMovementDetailView,
    CollectionPaymentCreateView,
    CollectionHistoryView,
)

urlpatterns = [
    # Collections
    path("collections/", CollectionListCreateView.as_view(), name="collection-list-create"),
    path("collections/<int:collection_id>/", CollectionDetailView.as_view(), name="collection-detail"),
    path("collections/history/", CollectionHistoryView.as_view(), name="collection-history"),
    
    # Bank Movements
    path("bank-movements/", BankMovementListCreateView.as_view(), name="bank-movement-list-create"),
    path("bank-movements/<int:bank_movement_id>/", BankMovementDetailView.as_view(), name="bank-movement-detail"),
    
    # Reconciliation
    path("collection-payments/", CollectionPaymentCreateView.as_view(), name="collection-payment-create"),
]