# Implementar modelo Task segun README.
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models

UF_CHOICES = [
    ("CLP", "CLP"),
    ("UF", "UF"),
]

UF_FIXED_RATE = Decimal("40000")

class Collection(models.Model):
    collection_id = models.BigAutoField(primary_key=True)
    contract_id = models.PositiveIntegerField()
    mes_cobro = models.DateField()
    monto_cobro = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, choices=UF_CHOICES)

    class Meta:
        ordering = ["mes_cobro", "contract_id"]

    def __str__(self):
        return f"{self.contract_id} - {self.mes_cobro} ({self.moneda} {self.monto_cobro})"

    @property
    def paid_amount_clp(self):
        return self.collectionpayment_set.aggregate(
            total=models.Sum("amount_clp")
        )["total"] or Decimal("0")

    @property
    def paid_amount_in_currency(self):
        if self.moneda == "UF":
            return self.paid_amount_clp / UF_FIXED_RATE
        return self.paid_amount_clp

    @property
    def is_paid(self):
        return self.paid_amount_in_currency >= self.monto_cobro
    
class BankMovement(models.Model):
    bank_movement_id = models.BigAutoField(primary_key=True)
    fecha = models.DateField()
    glosa = models.CharField(max_length=255, blank=True)
    monto = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Monto en CLP"
    )
    collections = models.ManyToManyField(
        Collection,
        through="CollectionPayment",
        related_name="bank_movements",
    )

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.fecha} · {self.monto} CLP"
    
class CollectionPayment(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    bank_movement = models.ForeignKey(BankMovement, on_delete=models.CASCADE)
    amount_clp = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Monto aplicado desde el movimiento bancario en CLP"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("collection", "bank_movement")

    def __str__(self):
        return f"{self.amount_clp} CLP → {self.collection}"