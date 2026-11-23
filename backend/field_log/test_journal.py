from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Crop, Field, Planting, Season, WorkEntry


class JournalAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model()
        agronomist = users.objects.create_user("agronomist")
        agronomist.groups.add(Group.objects.get(name="Агроном"))
        manager = users.objects.create_user("manager")
        manager.groups.add(Group.objects.get(name="Руководитель"))
        cls.agronomist_token = Token.objects.create(user=agronomist).key
        cls.manager_token = Token.objects.create(user=manager).key
        cls.unassigned_token = Token.objects.create(user=users.objects.create_user("other")).key

        cls.field = Field.objects.create(name="Северное", area_ha=Decimal("12.50"))
        cls.other_field = Field.objects.create(name="Южное", area_ha=Decimal("10.00"))
        crop = Crop.objects.create(name="Пшеница")
        cls.season = Season.objects.create(
            name="2026", start_date=date(2026, 4, 1), end_date=date(2026, 9, 30)
        )
        cls.other_season = Season.objects.create(
            name="2025", start_date=date(2025, 4, 1), end_date=date(2025, 9, 30)
        )
        cls.planting = Planting.objects.create(
            field=cls.field, crop=crop, season=cls.season, planted_on=date(2026, 4, 12)
        )
        cls.earlier_planting = Planting.objects.create(
            field=cls.field, crop=crop, season=cls.other_season, planted_on=date(2025, 4, 12)
        )
        other_planting = Planting.objects.create(
            field=cls.other_field, crop=crop, season=cls.season, planted_on=date(2026, 4, 12)
        )
        cls.entry = cls.create_entry(cls.planting, date(2026, 6, 1))
        cls.earlier_entry = cls.create_entry(cls.earlier_planting, date(2025, 6, 1))
        cls.other_field_entry = cls.create_entry(other_planting, date(2026, 6, 2))

    @staticmethod
    def create_entry(planting, work_date):
        return WorkEntry.objects.create(planting=planting, work_date=work_date, title="Осмотр", cost=0)

    def setUp(self):
        self.list_url = reverse("workentry-list")
        self.detail_url = reverse("workentry-detail", args=[self.entry.pk])
        self.payload = {
            "planting": self.planting.pk,
            "work_date": "2026-04-01",
            "title": "Подготовка почвы",
            "cost": "1250.50",
        }

    def authorize(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_agronomist_can_create_read_update_and_delete(self):
        self.authorize(self.agronomist_token)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["field"], self.field.pk)
        self.assertEqual(response.data["season"], self.season.pk)
        self.assertEqual(response.data["cost"], "1250.50")
        pk = response.data["id"]
        detail = reverse("workentry-detail", args=[pk])
        self.assertEqual(self.client.get(detail).data["title"], "Подготовка почвы")

        response = self.client.put(detail, {**self.payload, "cost": "0.00"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["cost"], "0.00")
        response = self.client.patch(detail, {"work_date": "2026-09-30"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["work_date"], "2026-09-30")
        self.assertEqual(WorkEntry.objects.get(pk=pk).cost, Decimal("0.00"))

        self.assertEqual(self.client.delete(detail).status_code, 204)
        self.assertEqual(self.client.get(detail).status_code, 404)

    def test_manager_can_read_and_filter_but_cannot_write(self):
        self.authorize(self.manager_token)
        for query, expected in (
            ({}, [self.other_field_entry.pk, self.entry.pk, self.earlier_entry.pk]),
            ({"field": self.field.pk}, [self.entry.pk, self.earlier_entry.pk]),
            ({"season": self.season.pk}, [self.other_field_entry.pk, self.entry.pk]),
            ({"field": self.field.pk, "season": self.season.pk}, [self.entry.pk]),
            ({"field": self.other_field.pk, "season": self.other_season.pk}, []),
        ):
            with self.subTest(query=query):
                response = self.client.get(self.list_url, query)
                self.assertEqual(response.status_code, 200)
                self.assertEqual([entry["id"] for entry in response.data], expected)

        self.assertEqual(self.client.get(self.detail_url).status_code, 200)
        self.assertEqual(self.client.post(self.list_url, self.payload, format="json").status_code, 403)
        self.assertEqual(self.client.put(self.detail_url, self.payload, format="json").status_code, 403)
        self.assertEqual(self.client.patch(self.detail_url, {"notes": "x"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(self.detail_url).status_code, 403)

    def test_anonymous_and_unassigned_users_cannot_access_the_journal(self):
        self.assertEqual(self.client.get(self.list_url).status_code, 401)
        self.authorize(self.unassigned_token)
        self.assertEqual(self.client.get(self.list_url).status_code, 403)

    def test_reference_lists_are_available_to_both_roles(self):
        for token in (self.agronomist_token, self.manager_token):
            self.authorize(token)
            for resource in ("field", "season", "planting"):
                with self.subTest(resource=resource):
                    response = self.client.get(reverse(f"{resource}-list"))
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(len(response.data), 3 if resource == "planting" else 2)
        self.assertEqual(self.client.get(reverse("planting-list")).data[0]["crop_name"], "Пшеница")

    def test_invalid_entries_and_filters_return_field_errors(self):
        self.authorize(self.agronomist_token)
        for field_name, value in (
            ("planting", 999999),
            ("planting", 1.5),
            ("work_date", "2026-03-31"),
            ("work_date", "2026-10-01"),
            ("work_date", "31.03.2026"),
            ("title", " "),
            ("cost", "-0.01"),
            ("cost", "10.001"),
        ):
            with self.subTest(field=field_name, value=value):
                response = self.client.post(
                    self.list_url, {**self.payload, field_name: value}, format="json"
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn(field_name, response.data)
        self.assertEqual(WorkEntry.objects.count(), 3)

        response = self.client.get(self.list_url, {"field": "wrong", "season": "0"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.data), {"field", "season"})
        response = self.client.patch(
            self.detail_url, {"planting": self.earlier_planting.pk}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("work_date", response.data)
        self.entry.refresh_from_db()
        self.assertEqual(self.entry.planting_id, self.planting.pk)
