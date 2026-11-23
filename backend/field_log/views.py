from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import Field, Planting, Season, WorkEntry
from .permissions import JournalModelPermissions
from .serializers import (
    FieldSerializer,
    PlantingSerializer,
    SeasonSerializer,
    WorkEntryFiltersSerializer,
    WorkEntrySerializer,
)


class FieldViewSet(ReadOnlyModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = FieldSerializer
    queryset = Field.objects.all()
    lookup_value_converter = "int"


class SeasonViewSet(ReadOnlyModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = SeasonSerializer
    queryset = Season.objects.all()
    lookup_value_converter = "int"


class PlantingViewSet(ReadOnlyModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = PlantingSerializer
    queryset = Planting.objects.select_related("crop")
    lookup_value_converter = "int"


class WorkEntryViewSet(ModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = WorkEntrySerializer
    queryset = WorkEntry.objects.select_related("planting__season")
    lookup_value_converter = "int"

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action != "list":
            return queryset

        filters = WorkEntryFiltersSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        return queryset.filter(
            **{f"planting__{name}_id": value for name, value in filters.validated_data.items()}
        )
