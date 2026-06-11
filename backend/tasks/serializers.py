# Implementar serializer segun README.

from decimal import Decimal
from rest_framework import serializers
from .models import Collection, BankMovement, CollectionPayment, UF_FIXED_RATE


class CollectionPaymentSerializer(serializers.ModelSerializer):
    bank_movement_date = serializers.DateField(source='bank_movement.fecha', read_only=True)
    bank_movement_glosa = serializers.CharField(source='bank_movement.glosa', read_only=True)

    class Meta:
        model = CollectionPayment
        fields = ('id', 'bank_movement', 'amount_clp', 'bank_movement_date', 'bank_movement_glosa', 'created_at')
        read_only_fields = ('id', 'created_at')


class CollectionSerializer(serializers.ModelSerializer):
    paid_amount_clp = serializers.SerializerMethodField()
    paid_amount_in_currency = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()
    payments = CollectionPaymentSerializer(source='collectionpayment_set', many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ('collection_id', 'contract_id', 'mes_cobro', 'monto_cobro', 'moneda', 
                  'paid_amount_clp', 'paid_amount_in_currency', 'is_paid', 'remaining_amount', 'payments')
        read_only_fields = ('collection_id', 'paid_amount_clp', 'paid_amount_in_currency', 'is_paid', 'remaining_amount', 'payments')

    def get_paid_amount_clp(self, obj):
        return obj.paid_amount_clp

    def get_paid_amount_in_currency(self, obj):
        return obj.paid_amount_in_currency

    def get_is_paid(self, obj):
        return obj.is_paid

    def get_remaining_amount(self, obj):
        return obj.monto_cobro - obj.paid_amount_in_currency


class BankMovementSerializer(serializers.ModelSerializer):
    used_amount = serializers.SerializerMethodField()
    available_amount = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()

    class Meta:
        model = BankMovement
        fields = ('bank_movement_id', 'fecha', 'glosa', 'monto', 'used_amount', 'available_amount', 'payments')
        read_only_fields = ('bank_movement_id', 'used_amount', 'available_amount', 'payments')

    def get_used_amount(self, obj):
        return obj.collectionpayment_set.aggregate(
            total=serializers.models.Sum('amount_clp')
        )['total'] or Decimal('0')

    def get_available_amount(self, obj):
        used = self.get_used_amount(obj)
        return obj.monto - used

    def get_payments(self, obj):
        payments = obj.collectionpayment_set.all()
        return CollectionPaymentSerializer(payments, many=True).data


class CollectionPaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating CollectionPayment entries (reconciliation)"""
    
    class Meta:
        model = CollectionPayment
        fields = ('collection', 'bank_movement', 'amount_clp')

    def validate(self, data):
        collection = data['collection']
        bank_movement = data['bank_movement']
        amount_clp = data['amount_clp']

        # Validate amount is positive
        if amount_clp <= 0:
            raise serializers.ValidationError("amount_clp must be greater than 0")

        # Validate collection is not already paid from this bank movement
        if CollectionPayment.objects.filter(
            collection=collection,
            bank_movement=bank_movement
        ).exists():
            raise serializers.ValidationError(
                "This collection is already paid by this bank movement."
            )

        # Validate bank movement has enough available funds
        used_amount = bank_movement.collectionpayment_set.aggregate(
            total=serializers.models.Sum('amount_clp')
        )['total'] or Decimal('0')
        
        available_amount = bank_movement.monto - used_amount
        if amount_clp > available_amount:
            raise serializers.ValidationError(
                f"Bank movement only has {available_amount} CLP available."
            )

        # Validate collection won't be overpaid
        current_paid = collection.paid_amount_in_currency
        amount_in_collection_currency = amount_clp
        
        if collection.moneda == "UF":
            amount_in_collection_currency = amount_clp / UF_FIXED_RATE

        if current_paid + amount_in_collection_currency > collection.monto_cobro:
            overpayment = (current_paid + amount_in_collection_currency) - collection.monto_cobro
            raise serializers.ValidationError(
                f"This payment would overpay the collection by {overpayment} {collection.moneda}. "
                f"Maximum allowed: {collection.monto_cobro - current_paid} {collection.moneda}"
            )

        return data
