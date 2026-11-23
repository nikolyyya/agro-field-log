from rest_framework.routers import SimpleRouter

from .views import FieldViewSet, PlantingViewSet, SeasonViewSet, WorkEntryViewSet


router = SimpleRouter(use_regex_path=False)
router.register("fields", FieldViewSet)
router.register("seasons", SeasonViewSet)
router.register("plantings", PlantingViewSet)
router.register("work-entries", WorkEntryViewSet)

urlpatterns = router.urls
