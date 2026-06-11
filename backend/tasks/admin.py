from django.contrib import admin
from .models import Collection, BankMovement, CollectionPayment

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('collection_id', 'contract_id', 'mes_cobro', 'monto_cobro', 'moneda', 'is_paid')
    list_filter = ('moneda', 'mes_cobro')
    search_fields = ('contract_id',)
    readonly_fields = ('collection_id', 'paid_amount_clp', 'paid_amount_in_currency', 'is_paid')
    fieldsets = (
        ('Basic Info', {
            'fields': ('collection_id', 'contract_id', 'mes_cobro', 'monto_cobro', 'moneda')
        }),
        ('Payment Status', {
            'fields': ('paid_amount_clp', 'paid_amount_in_currency', 'is_paid')
        }),
    )

@admin.register(BankMovement)
class BankMovementAdmin(admin.ModelAdmin):
    list_display = ('bank_movement_id', 'fecha', 'monto', 'glosa')
    list_filter = ('fecha',)
    search_fields = ('glosa',)
    readonly_fields = ('bank_movement_id',)
    ordering = ('-fecha',)

@admin.register(CollectionPayment)
class CollectionPaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'collection', 'bank_movement', 'amount_clp', 'created_at')
    list_filter = ('created_at', 'bank_movement__fecha')
    search_fields = ('collection__contract_id', 'bank_movement__glosa')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'