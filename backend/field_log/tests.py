from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, APITestCase

from .models import WorkEntry
from .permissions import CanViewCostReport, JournalModelPermissions


class AccessTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model()
        cls.agronomist = users.objects.create_user("agronomist", password="field-log-test")
        cls.agronomist.groups.add(Group.objects.get(name="Агроном"))
        cls.manager = users.objects.create_user("manager", is_staff=True)
        cls.manager.groups.add(Group.objects.get(name="Руководитель"))
        cls.unassigned = users.objects.create_user("unassigned")

    def test_health_is_public_even_with_a_bad_token(self):
        self.assertEqual(self.client.get(reverse("health")).status_code, 200)
        response = self.client.get(reverse("health"), HTTP_AUTHORIZATION="Token invalid")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_login_requires_valid_credentials_and_issues_a_token(self):
        addr = "192.0.2.1"
        cache.delete(f"throttle_login_{addr}")
        self.addCleanup(cache.delete, f"throttle_login_{addr}")
        url = reverse("auth-token")
        response = self.client.post(
            url, {"username": "agronomist", "password": "wrong"}, format="json", REMOTE_ADDR=addr
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Token.objects.filter(user=self.agronomist).exists())

        response = self.client.post(
            url,
            {"username": "agronomist", "password": "field-log-test"},
            format="json",
            REMOTE_ADDR=addr,
        )
        self.assertEqual(response.status_code, 200)
        token = Token.objects.get(user=self.agronomist)
        self.assertEqual(response.json(), {"token": token.key})

    def test_default_api_authentication_accepts_only_a_valid_token(self):
        @api_view(["GET"])
        def protected(request):
            return Response({"username": request.user.username})

        factory = APIRequestFactory()
        self.assertEqual(protected(factory.get("/")).status_code, 401)
        self.assertEqual(
            protected(factory.get("/", HTTP_AUTHORIZATION="Token invalid")).status_code, 401
        )

        token = Token.objects.create(user=self.agronomist)
        response = protected(factory.get("/", HTTP_AUTHORIZATION=f"Token {token.key}"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"username": self.agronomist.username})

    def test_journal_and_report_permissions_by_role(self):
        factory = APIRequestFactory()
        permission = JournalModelPermissions()
        report = CanViewCostReport()

        class JournalView:
            queryset = WorkEntry.objects.all()

        for user, can_read, can_write, can_report in (
            (self.agronomist, True, True, False),
            (self.manager, True, False, True),
            (self.unassigned, False, False, False),
        ):
            for method in ("get", "head", "options", "post", "put", "patch", "delete"):
                request = getattr(factory, method)("/")
                request.user = user
                expected = can_read if method in ("get", "head", "options") else can_write
                with self.subTest(user=user.username, method=method):
                    self.assertEqual(permission.has_permission(request, JournalView()), expected)
                    self.assertEqual(
                        report.has_permission(request, None),
                        can_report and method in ("get", "head", "options"),
                    )

    def test_admin_enforces_the_same_work_entry_permissions(self):
        list_url = reverse("admin:field_log_workentry_changelist")
        add_url = reverse("admin:field_log_workentry_add")
        self.client.force_login(self.manager)
        self.assertEqual(self.client.get(list_url).status_code, 200)
        self.assertEqual(self.client.post(add_url).status_code, 403)

        self.agronomist.is_staff = True
        self.agronomist.save(update_fields=["is_staff"])
        self.client.force_login(self.agronomist)
        self.assertEqual(self.client.get(add_url).status_code, 200)
        self.assertEqual(self.client.get(reverse("admin:field_log_field_add")).status_code, 403)
