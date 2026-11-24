from datetime import date
from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Crop, Field, Planting, Season, WorkEntry


class CostReportTests(APITestCase):
    def setUp(self):
        self.url = reverse("cost-report")

    def use_token(self, username, role=None):
        user = get_user_model().objects.create_user(username)
        if role:
            user.groups.add(Group.objects.get(name=role))
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_report_requires_report_permission(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.use_token("agronomist", "Агроном")
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.use_token("unassigned")
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.use_token("manager", "Руководитель")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_demo_data_report_filters_and_repeated_loading(self):
        models = (Field, Crop, Season, Planting, WorkEntry)
        for _ in range(2):
            call_command("seed_demo", stdout=StringIO())
            self.assertEqual(tuple(model.objects.count() for model in models), (2, 2, 2, 4, 4))

        self.use_token("manager", "Руководитель")
        north = Field.objects.get(name="Демо — Северное")
        south = Field.objects.get(name="Демо — Южное")
        current = Season.objects.get(name="Демо — 2026")
        previous = Season.objects.get(name="Демо — 2025")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        totals = {
            (row["field"], row["season"]): (row["total_cost"], row["cost_per_ha"])
            for row in response.json()
        }
        self.assertEqual(totals, {
            (north.pk, current.pk): ("12500.00", "1000.00"),
            (north.pk, previous.pk): ("6250.00", "500.00"),
            (south.pk, current.pk): ("8000.00", "400.00"),
            (south.pk, previous.pk): ("0.00", "0.00"),
        })
        response = self.client.get(self.url, {"field": north.pk, "season": current.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [{
            "field": north.pk,
            "field_name": north.name,
            "season": current.pk,
            "season_name": current.name,
            "area_ha": "12.50",
            "total_cost": "12500.00",
            "cost_per_ha": "1000.00",
        }])
        self.assertEqual(len(self.client.get(self.url, {"season": current.pk}).json()), 2)

    def test_report_adds_multiple_plantings_and_rounds_to_kopecks(self):
        field = Field.objects.create(name="Восточное", area_ha=Decimal("2.00"))
        crop = Crop.objects.create(name="Рожь")
        season = Season.objects.create(
            name="2026", start_date=date(2026, 4, 1), end_date=date(2026, 9, 30)
        )
        for day, cost in ((12, "0.10"), (15, "0.21")):
            work_date = date(2026, 4, day)
            planting = Planting.objects.create(
                field=field, crop=crop, season=season, planted_on=work_date
            )
            WorkEntry.objects.create(
                planting=planting, work_date=work_date, title="Посев", cost=Decimal(cost)
            )

        self.use_token("manager", "Руководитель")
        response = self.client.get(self.url, {"field": field.pk})
        self.assertEqual(response.status_code, 200)
        rows = response.json()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["total_cost"], "0.31")
        self.assertEqual(rows[0]["cost_per_ha"], "0.16")

    def test_invalid_filters_return_field_errors(self):
        self.use_token("manager", "Руководитель")
        response = self.client.get(self.url, {"field": "wrong", "season": "0"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"field", "season"})
