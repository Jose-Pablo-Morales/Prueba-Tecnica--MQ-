from decimal import Decimal
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Collection, BankMovement, CollectionPayment
from .serializers import (
    CollectionSerializer,
    BankMovementSerializer,
    CollectionPaymentSerializer,
    CollectionPaymentCreateSerializer,
)


class CollectionListCreateView(APIView):
    """List all collections or create a new one"""

    def get(self, request, *args, **kwargs):  # noqa: ARG002
        collections = Collection.objects.all()
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = CollectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CollectionDetailView(APIView):
    """Retrieve a specific collection with payment history"""

    def get(self, request, collection_id: int, *args, **kwargs):  # noqa: ARG002
        collection = get_object_or_404(Collection, collection_id=collection_id)
        serializer = CollectionSerializer(collection)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BankMovementListCreateView(APIView):
    """List all bank movements or create a new one"""

    def get(self, request, *args, **kwargs):  # noqa: ARG002
        movements = BankMovement.objects.all()
        serializer = BankMovementSerializer(movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = BankMovementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BankMovementDetailView(APIView):
    """Retrieve a specific bank movement with payment details"""

    def get(self, request, bank_movement_id: int, *args, **kwargs):  # noqa: ARG002
        movement = get_object_or_404(BankMovement, bank_movement_id=bank_movement_id)
        serializer = BankMovementSerializer(movement)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CollectionPaymentCreateView(APIView):
    """
    Create a CollectionPayment to reconcile a bank movement to one or more collections.
    This is where the reconciliation happens: assign part/all of a bank movement to a collection.
    """

    def post(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = CollectionPaymentCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Return the full payment details
            payment = serializer.instance
            response_serializer = CollectionPaymentSerializer(payment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CollectionHistoryView(APIView):
    """Get collection history: pending vs paid collections"""

    def get(self, request, *args, **kwargs):  # noqa: ARG002
        status_filter = request.query_params.get('status', 'all')  # 'all', 'pending', 'paid'
        
        if status_filter == 'pending':
            collections = Collection.objects.filter(collectionpayment__isnull=True).distinct()
        elif status_filter == 'paid':
            collections = Collection.objects.exclude(collectionpayment__isnull=True).distinct()
        else:
            collections = Collection.objects.all()
        
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
