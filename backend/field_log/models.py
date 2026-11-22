from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Field(models.Model):
    name = models.CharField("Название", max_length=120, unique=True)
    area_ha = models.DecimalField(
        "Площадь, га",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    class Meta:
        ordering = ("name",)
        verbose_name = "поле"
        verbose_name_plural = "поля"
        constraints = [
            models.CheckConstraint(condition=models.Q(area_ha__gt=0), name="field_area_positive"),
        ]

    def __str__(self):
        return self.name


class Crop(models.Model):
    name = models.CharField("Название", max_length=120, unique=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "культура"
        verbose_name_plural = "культуры"

    def __str__(self):
        return self.name


class Season(models.Model):
    name = models.CharField("Название", max_length=120, unique=True)
    start_date = models.DateField("Начало сезона")
    end_date = models.DateField("Конец сезона")

    class Meta:
        ordering = ("-start_date", "name")
        verbose_name = "сезон"
        verbose_name_plural = "сезоны"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_date__gte=models.F("start_date")),
                name="season_dates_ordered",
                violation_error_message="Конец сезона должен быть не раньше его начала.",
            ),
        ]

    def __str__(self):
        return self.name


class Planting(models.Model):
    field = models.ForeignKey(
        Field, on_delete=models.PROTECT, related_name="plantings", verbose_name="Поле"
    )
    crop = models.ForeignKey(
        Crop, on_delete=models.PROTECT, related_name="plantings", verbose_name="Культура"
    )
    season = models.ForeignKey(
        Season, on_delete=models.PROTECT, related_name="plantings", verbose_name="Сезон"
    )
    planted_on = models.DateField("Дата посева")

    class Meta:
        ordering = ("-planted_on", "-pk")
        verbose_name = "посев"
        verbose_name_plural = "посевы"

    def __str__(self):
        return f"{self.field} / {self.crop} / {self.season} ({self.planted_on:%d.%m.%Y})"


class WorkEntry(models.Model):
    planting = models.ForeignKey(
        Planting, on_delete=models.PROTECT, related_name="work_entries", verbose_name="Посев"
    )
    work_date = models.DateField("Дата работы")
    title = models.CharField("Вид работы", max_length=160)
    cost = models.DecimalField(
        "Затраты, руб.",
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    notes = models.TextField("Примечания", blank=True)

    class Meta:
        ordering = ("-work_date", "-pk")
        verbose_name = "запись о работе"
        verbose_name_plural = "записи о работах"
        permissions = [("view_cost_report", "Может просматривать отчёт о затратах")]
        constraints = [
            models.CheckConstraint(condition=models.Q(cost__gte=0), name="work_cost_nonnegative"),
        ]

    def __str__(self):
        return f"{self.title} ({self.work_date:%d.%m.%Y})"
