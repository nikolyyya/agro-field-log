from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from field_log.models import Crop, Field, Planting, Season, WorkEntry


class Command(BaseCommand):
    help = "Добавляет демонстрационные поля, культуры, сезоны, посевы и работы."

    @transaction.atomic
    def handle(self, *args, **options):
        north, _ = Field.objects.get_or_create(
            name="Демо — Северное", defaults={"area_ha": Decimal("12.50")}
        )
        south, _ = Field.objects.get_or_create(
            name="Демо — Южное", defaults={"area_ha": Decimal("20.00")}
        )
        wheat, _ = Crop.objects.get_or_create(name="Демо — Пшеница")
        barley, _ = Crop.objects.get_or_create(name="Демо — Ячмень")

        for field, crop, year, works in (
            (north, wheat, 2026, ((4, 15, "Посев", "9000.00"), (6, 10, "Подкормка", "3500.00"))),
            (south, barley, 2026, ((4, 15, "Посев", "8000.00"),)),
            (north, barley, 2025, ((4, 15, "Посев", "6250.00"),)),
            (south, wheat, 2025, ()),
        ):
            season, _ = Season.objects.get_or_create(
                name=f"Демо — {year}",
                defaults={"start_date": date(year, 4, 1), "end_date": date(year, 9, 30)},
            )
            planting = Planting.objects.filter(field=field, crop=crop, season=season).order_by("pk").first()
            if planting is None:
                planting = Planting.objects.create(
                    field=field, crop=crop, season=season, planted_on=date(year, 4, 15)
                )
            for month, day, title, cost in works:
                work_date = date(year, month, day)
                exists = WorkEntry.objects.filter(
                    planting=planting, work_date=work_date, title=title
                ).exists()
                if not exists:
                    WorkEntry.objects.create(
                        planting=planting, work_date=work_date, title=title, cost=Decimal(cost)
                    )

        self.stdout.write(self.style.SUCCESS("Демонстрационные данные готовы."))
