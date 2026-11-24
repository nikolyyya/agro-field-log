from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import CostReportView, FieldViewSet, PlantingViewSet, SeasonViewSet, WorkEntryViewSet


router = SimpleRouter(use_regex_path=False)
router.register("fields", FieldViewSet)
router.register("seasons", SeasonViewSet)
router.register("plantings", PlantingViewSet)
router.register("work-entries", WorkEntryViewSet)

urlpatterns = [
    path("reports/costs/", CostReportView.as_view(), name="cost-report"),
    *router.urls,
]
